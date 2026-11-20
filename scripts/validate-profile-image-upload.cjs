const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const vm = require("node:vm");
const { QueryClient } = require("@tanstack/react-query");

function load(path, modules = {}, globals = {}) {
  const mod = { exports: {} };
  const js = ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(js, {
    module: mod, exports: mod.exports, console, Promise, DOMException,
    require: name => name.endsWith(".css") ? {} : (modules[name] || require(name)),
    ...globals,
  });
  return mod.exports;
}
const flush = () => new Promise(resolve => setImmediate(resolve));

class FakeXHR {
  static last;
  events = {};
  upload = { addEventListener: () => {} };
  headers = {};
  status = 0;
  responseText = "";
  constructor() { FakeXHR.last = this; }
  open(...args) { this.opened = args; }
  setRequestHeader(key, value) { this.headers[key] = value; }
  addEventListener(key, fn) { this.events[key] = fn; }
  send(body) { this.body = body; }
  abort() { this.events.abort?.(); }
  getResponseHeader() { return this.etag || null; }
  respond(status, etag) { this.status = status; this.etag = etag; this.events.load(); }
}
const { uploadSinglePart } = load("client/src/lib/singlePartUpload.ts", {}, { XMLHttpRequest: FakeXHR });
const upload = extra => uploadSinglePart({
  signature: { url: "https://storage.example/fixture", method: "PUT", headers: { "Content-Type": "image/png" } },
  body: {}, size: 4, onProgress() {}, onComplete() {}, ...extra,
});

test("storage 2xx completes without requiring a browser-visible ETag", async () => {
  let complete = false;
  const pending = upload({ onComplete: () => { complete = true; } });
  FakeXHR.last.respond(200);
  const result = await pending;
  assert.equal(result.ETag, "");
  assert.ok(complete);
  assert.equal(FakeXHR.last.headers["Content-Type"], "image/png");
});
test("exposed ETag is preserved and callbacks complete exactly once", async () => {
  let count = 0;
  const pending = upload({ onComplete: () => { count++; } });
  FakeXHR.last.respond(201, "real-storage-tag");
  FakeXHR.last.respond(201, "real-storage-tag");
  assert.equal((await pending).ETag, "real-storage-tag");
  assert.equal(count, 1);
});
test("rejected HTTP, connection interruption and timeout reject instead of hanging", async () => {
  for (const event of ["http", "error", "timeout"]) {
    const pending = upload();
    if (event === "http") FakeXHR.last.respond(503);
    else FakeXHR.last.events[event]();
    await assert.rejects(pending);
  }
});
test("expired signatures remain recognizable to the SDK retry logic", async () => {
  const pending = upload();
  FakeXHR.last.responseText = "<Message>Request has expired</Message>";
  FakeXHR.last.respond(403);
  await assert.rejects(pending, error => error.message === "Request has expired" && error.source.status === 403);
});
test("abort rejects promptly, including before upload starts", async () => {
  for (const before of [true, false]) {
    const controller = new AbortController();
    if (before) controller.abort();
    const pending = upload({ signal: controller.signal });
    if (!before) controller.abort();
    await assert.rejects(pending, error => error.name === "AbortError");
  }
});

function uploaderHarness(onComplete = async () => {}) {
  const hooks = [];
  const notices = [];
  let cursor = 0;
  let instance;
  const react = {
    useState(initial) {
      const key = cursor++;
      if (!(key in hooks)) hooks[key] = typeof initial === "function" ? initial() : initial;
      return [hooks[key], value => { hooks[key] = typeof value === "function" ? value(hooks[key]) : value; }];
    },
    useRef(value) {
      const key = cursor++;
      if (!(key in hooks)) hooks[key] = { current: value };
      return hooks[key];
    },
  };
  class Uppy {
    events = {};
    cancelled = 0;
    retried = 0;
    constructor() { instance = this; }
    use(plugin, options) { this.options = options; return this; }
    on(key, callback) { this.events[key] = callback; return this; }
    cancelAll() { this.cancelled++; }
    async retryAll() { this.retried++; this.events.complete(this.retryResult); }
  }
  const names = ["AlertDialog", "AlertDialogContent", "AlertDialogHeader", "AlertDialogTitle", "AlertDialogDescription", "AlertDialogFooter", "AlertDialogCancel"];
  const { ObjectUploader } = load("client/src/components/ObjectUploader.tsx", {
    react,
    "@uppy/core": Uppy,
    "@uppy/aws-s3": function AwsS3() {},
    "@uppy/react": { Dashboard: "Dashboard" },
    "@/components/ui/button": { Button: "Button" },
    "@/hooks/use-toast": { useToast: () => ({ toast: message => notices.push(message) }) },
    "@/lib/singlePartUpload": { uploadSinglePart },
    "@/components/ui/alert-dialog": Object.fromEntries(names.map(name => [name, name])),
    "@/components/ui/dialog": Object.fromEntries(["Dialog", "DialogContent", "DialogHeader", "DialogTitle"].map(name => [name, name])),
  });
  let props = { children: "Upload", onComplete, onGetUploadParameters: async () => ({ method: "PUT", url: "fixture" }) };
  function render(next) { props = { ...props, ...next }; cursor = 0; return ObjectUploader(props); }
  function find(node, predicate) {
    if (!node || typeof node !== "object") return;
    if (predicate(node)) return node;
    for (const child of [node.props?.children].flat(Infinity)) {
      const match = find(child, predicate);
      if (match) return match;
    }
  }
  render();
  return { render, find, get uppy() { return instance; }, notices };
}
const success = { successful: [{ uploadURL: "https://storage.example/fixture" }], failed: [] };

test("failed transfer retains selection and Try again retries transfer, not finalization", async () => {
  let saves = 0;
  const harness = uploaderHarness(async () => { saves++; });
  harness.uppy.events.complete({ successful: [], failed: [{ id: "file" }] });
  await flush();
  assert.equal(harness.uppy.cancelled, 0);
  assert.equal(saves, 0);
  const tree = harness.render();
  assert.ok(harness.find(tree, node => node.type === "AlertDialog").props.open);
  harness.uppy.retryResult = success;
  harness.find(tree, node => node.props?.["data-testid"] === "button-retry-upload").props.onClick();
  await flush();
  assert.equal(harness.uppy.retried, 1);
  assert.equal(saves, 1);
  assert.equal(harness.uppy.cancelled, 1);
  assert.equal(harness.notices.length, 0);
});
test("failed profile save retains the uploaded image and retries without uploading again", async () => {
  let saves = 0;
  const harness = uploaderHarness(async () => { if (++saves === 1) throw new Error("temporary save failure"); });
  harness.uppy.events.complete(success);
  await flush();
  assert.equal(harness.uppy.cancelled, 0);
  const tree = harness.render();
  const retry = harness.find(tree, node => node.props?.["data-testid"] === "button-retry-upload");
  retry.props.onClick();
  retry.props.onClick(); // A rapid double tap must not duplicate the save.
  await flush();
  assert.equal(saves, 2);
  assert.equal(harness.uppy.retried, 0);
  assert.equal(harness.uppy.cancelled, 1);
});
test("completion and signed-URL callbacks use latest props, not first-render closures", async () => {
  let current = 0;
  const harness = uploaderHarness(() => assert.fail("stale completion"));
  harness.render({
    onComplete: async () => { current++; },
    onGetUploadParameters: async () => ({ method: "PUT", url: "current" }),
  });
  assert.equal((await harness.uppy.options.getUploadParameters({ type: "image/png" })).url, "current");
  harness.uppy.events.complete(success);
  await flush();
  assert.equal(current, 1);
});
test("file chooser uses the shared foreground dialog, not an inline vendor modal", () => {
  const source = fs.readFileSync("client/src/components/ObjectUploader.tsx", "utf8");
  assert.doesNotMatch(source, /DashboardModal/);
  assert.match(source, /<DialogContent/);
  assert.match(source, /height="min\(650px, calc\(100dvh - 8rem\)\)"/);
});

test("profile then background saves preserve both images and clear both cache tiers", async () => {
  const removed = [];
  const { applyProfileImageUpdate } = load("client/src/lib/profileImageCache.ts", {
    "./enterprise/enhancedCache": { enhancedCache: { removeByPattern: async key => { removed.push(key); } } },
  });
  const cache = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  const old = { id: "fixture", profileImageUrl: "old-profile", backgroundImageUrl: "old-background", updatedAt: "2026-01-01T00:00:00Z" };
  cache.setQueryData(["/api/auth/user"], old);
  await applyProfileImageUpdate(cache, "profileImageUrl", { ...old, profileImageUrl: "new-profile", updatedAt: "2026-01-01T00:00:01Z" });
  await applyProfileImageUpdate(cache, "backgroundImageUrl", { ...old, backgroundImageUrl: "new-background", updatedAt: "2026-01-01T00:00:02Z" });
  assert.equal(cache.getQueryData(["/api/auth/user"]).profileImageUrl, "new-profile");
  assert.equal(cache.getQueryData(["/api/auth/user"]).backgroundImageUrl, "new-background");
  assert.equal(removed.length, 4);
  cache.clear();
});
test("cache cleanup failures do not turn an already saved image into an upload failure", async () => {
  const { applyProfileImageUpdate } = load("client/src/lib/profileImageCache.ts", {
    "./enterprise/enhancedCache": { enhancedCache: { removeByPattern: async () => { throw new Error("disk unavailable"); } } },
  });
  const cache = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  cache.setQueryData(["/api/auth/user"], { id: "fixture" });
  await applyProfileImageUpdate(cache, "profileImageUrl", { id: "fixture", profileImageUrl: "saved" });
  assert.equal(cache.getQueryData(["/api/auth/user"]).profileImageUrl, "saved");
  cache.clear();
});

test("background save cannot undo a newer avatar when a stale user fetch is cancelled", async () => {
  const { applyProfileImageUpdate } = load("client/src/lib/profileImageCache.ts", {
    "./enterprise/enhancedCache": { enhancedCache: { removeByPattern: async () => {} } },
  });
  const cache = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  const key = ["/api/auth/user"];
  const old = { id: "fixture", profileImageUrl: "old", backgroundImageUrl: "old", updatedAt: "2026-01-01T00:00:00Z" };
  cache.setQueryData(key, old);
  let finish;
  const pending = cache.fetchQuery({ queryKey: key, queryFn: () => new Promise(resolve => { finish = resolve; }) }).catch(() => {});
  cache.setQueryData(key, { ...old, profileImageUrl: "new-avatar", updatedAt: "2026-01-01T00:00:01Z" });
  await applyProfileImageUpdate(cache, "backgroundImageUrl", { ...old, backgroundImageUrl: "new-background", updatedAt: "2026-01-01T00:00:02Z" });
  finish(old);
  await pending;
  assert.equal(cache.getQueryData(key).profileImageUrl, "new-avatar");
  assert.equal(cache.getQueryData(key).backgroundImageUrl, "new-background");
  cache.clear();
});
test("late upload completion cannot restore a logged-out profile or overwrite another member", async () => {
  const { applyProfileImageUpdate } = load("client/src/lib/profileImageCache.ts", {
    "./enterprise/enhancedCache": { enhancedCache: { removeByPattern: async () => {} } },
  });
  const cache = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  for (const current of [null, { id: "another-member", profileImageUrl: "their-avatar" }]) {
    cache.setQueryData(["/api/auth/user"], current);
    await applyProfileImageUpdate(cache, "profileImageUrl", { id: "old-member", profileImageUrl: "late-avatar" });
    assert.equal(cache.getQueryData(["/api/auth/user"]), current);
  }
  cache.clear();
});
