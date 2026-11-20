const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { QueryClient } = require("@tanstack/react-query");

function load(source, context = {}) {
  const mod = { exports: {} };
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(js, { module: mod, exports: mod.exports, URL, ...context });
  return mod.exports;
}
const helpers = load(fs.readFileSync("client/src/lib/postDataCache.ts", "utf8"));
const { mergeSavedPostEdit, applySavedPostEdit, isPostDataUrl } = helpers;
const saved = { id: "edited", content: "saved edit", updatedAt: "2026-11-19T20:00:00Z" };
const original = { id: "edited", content: "original", mediaUrl: "/photo.jpg", author: { name: "Fixture" }, likes: [{ id: "like" }], comments: [{ id: "comment" }] };
const client = () => new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });

test("post data bypasses private SWR cache for every feed page and post URL", () => {
  for (const url of ["/api/kliq-feed?page=2&limit=100", "/api/posts", "/api/posts/user/fixture", "/api/posts/edited", "https://api.mykliq.app/api/kliq-feed?page=1"]) assert.ok(isPostDataUrl(url), url);
  for (const url of ["/api/stories", "/api/posts-metadata", "/api/user/theme"]) assert.equal(isPostDataUrl(url), false);
  const fetchSource = fs.readFileSync("client/src/lib/enterprise/enterpriseFetch.ts", "utf8");
  assert.match(fetchSource, /skipAllCache\s*=.*isPostDataUrl\(url\)/);
  assert.match(fetchSource, /skipMemory:\s*skipAllCache/);
  assert.match(fetchSource, /skipDisk:\s*skipDisk \|\| skipAllCache/);
});

test("saved fields update all pages without replacing author/media/likes/comments", () => {
  const other = { id: "untouched", content: "other" };
  const data = { pages: [{ items: [other] }, { items: [original], hasMore: false }], pageParams: [1, 2] };
  const updated = mergeSavedPostEdit(data, saved);
  const post = updated.pages[1].items[0];
  assert.equal(post.content, saved.content);
  for (const key of ["author", "mediaUrl", "likes", "comments"]) assert.equal(post[key], original[key]);
  assert.equal(updated.pages[0], data.pages[0]);
  assert.equal(updated.pageParams, data.pageParams);
  assert.equal(updated.pages[1].hasMore, false);
  assert.equal(data.pages[1].items[0].content, "original");
});

test("array, detail and posts-wrapper caches work; missing data stays untouched", () => {
  assert.equal(mergeSavedPostEdit([original], saved)[0].content, saved.content);
  assert.equal(mergeSavedPostEdit(original, saved).content, saved.content);
  assert.equal(mergeSavedPostEdit({ posts: [original], count: 1 }, saved).posts[0].content, saved.content);
  for (const empty of [undefined, null, {}, []]) assert.equal(mergeSavedPostEdit(empty, saved), empty);
});

test("confirmed edits patch active caches immediately without a feed refetch", async () => {
  const cache = client();
  cache.setQueryData(["/api/kliq-feed"], { pages: [{ items: [original] }], pageParams: [1] });
  cache.setQueryData(["/api/posts/user", "fixture"], [original]);
  cache.setQueryData(["/api/posts/edited"], original);
  cache.setQueryData(["/api/stories"], [original]);
  await applySavedPostEdit(cache, saved);
  assert.equal(cache.getQueryData(["/api/kliq-feed"]).pages[0].items[0].content, saved.content);
  assert.equal(cache.getQueryData(["/api/posts/user", "fixture"])[0].content, saved.content);
  assert.equal(cache.getQueryData(["/api/posts/edited"]).content, saved.content);
  assert.equal(cache.getQueryData(["/api/stories"])[0].content, "original");
  assert.ok(cache.getQueryState(["/api/kliq-feed"]).isInvalidated);
  assert.equal(cache.isFetching(), 0);
  cache.clear();
});

test("a slow pre-save feed response cannot overwrite the confirmed edit", async () => {
  const cache = client();
  const key = ["/api/kliq-feed"];
  const stale = { pages: [{ items: [original] }], pageParams: [1] };
  cache.setQueryData(key, stale);
  let finish;
  const pending = cache.fetchQuery({ queryKey: key, queryFn: () => new Promise(resolve => { finish = resolve; }) }).catch(() => {});
  const newerLikes = [{ id: "new-local-like" }];
  cache.setQueryData(key, { pages: [{ items: [{ ...original, likes: newerLikes }] }], pageParams: [1] });
  await applySavedPostEdit(cache, saved);
  finish(stale);
  await pending;
  await Promise.resolve();
  assert.equal(cache.getQueryData(key).pages[0].items[0].content, saved.content);
  assert.deepEqual(cache.getQueryData(key).pages[0].items[0].likes, newerLikes);
  cache.clear();
});

function editHandler(context) {
  const source = fs.readFileSync("client/src/pages/home.tsx", "utf8");
  const ast = ts.createSourceFile("home.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let handler;
  function walk(node) {
    if (!handler && ts.isVariableDeclaration(node) && node.name.getText(ast) === "handleUpdate") handler = node.initializer.getText(ast);
    ts.forEachChild(node, walk);
  }
  walk(ast);
  assert.ok(handler);
  return load(`module.exports = ${handler}`, { console: { error() {} }, ...context });
}

test("actual edit handler applies the save response, not a delayed refetch", async () => {
  const cache = client();
  cache.setQueryData(["/api/kliq-feed"], { pages: [{ items: [original] }] });
  const notices = [];
  const removed = [];
  let refetches = 0;
  let submitting = false;
  const handler = editHandler({
    queryClient: cache, applySavedPostEdit, post: original, editContent: "requested edit",
    setIsSubmitting: value => { submitting = value; },
    toast: message => notices.push(message),
    onUpdate: () => { refetches++; },
    enhancedCache: { removeByPattern: async pattern => { removed.push(pattern); } },
    apiRequest: async (method, url, body) => {
      assert.equal(method, "PUT");
      assert.equal(url, "/api/posts/edited");
      assert.equal(body.content, "requested edit");
      // Use server-confirmed text, even if it differs from the submitted draft.
      return saved;
    },
  });
  await handler();
  assert.equal(cache.getQueryData(["/api/kliq-feed"]).pages[0].items[0].content, saved.content);
  assert.equal(refetches, 0);
  assert.equal(submitting, false);
  assert.equal(notices[0].title, "Post Updated");
  assert.equal(removed.join(","), "/api/kliq-feed,/api/posts");
  cache.clear();
});

test("failed save keeps the original post and draft, reports error and permits retry", async () => {
  const cache = client();
  cache.setQueryData(["/api/kliq-feed"], { pages: [{ items: [original] }] });
  const notices = [];
  let submitting;
  const handler = editHandler({
    queryClient: cache, post: original, editContent: "unsaved draft",
    applySavedPostEdit: () => assert.fail("must not apply failed save"),
    setEditContent: () => assert.fail("must not erase draft"),
    setIsSubmitting: value => { submitting = value; },
    toast: message => notices.push(message),
    apiRequest: async () => { throw new Error("save failed"); },
  });
  await handler();
  assert.equal(cache.getQueryData(["/api/kliq-feed"]).pages[0].items[0].content, "original");
  assert.equal(submitting, false);
  assert.equal(notices[0].variant, "destructive");
  cache.clear();
});
