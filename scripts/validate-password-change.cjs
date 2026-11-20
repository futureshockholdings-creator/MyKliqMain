const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const bcrypt = require("bcrypt");
function load(path, imports = {}) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, {
    module, exports: module.exports, TextEncoder, console,
    require: name => imports[name] || require(name),
  });
  return module.exports;
}
const schema = load("shared/passwordChange.ts");
const { createPasswordChangeHandler } = load("server/passwordChange.ts", { "../shared/passwordChange": schema });
const values = { currentPassword: "Original-Password123!", newPassword: "Replacement-Password456!", confirmPassword: "Replacement-Password456!" };
function fixture(overrides = {}) {
  const calls = { writes: 0, cache: 0 };
  const deps = {
    getUser: async () => ({ password: "legacy-encrypted" }),
    decryptPassword: () => values.currentPassword,
    replacePassword: async (id, previous, hash) => {
      calls.writes++;
      calls.id = id;
      calls.previous = previous;
      calls.hash = hash;
      return true;
    },
    clearCache: async () => { calls.cache++; },
    ...overrides,
  };
  const run = async (body = values, user = { claims: { sub: "fixture-user" } }) => {
    const res = { statusCode: 200, headers: {}, set(k, v) { this.headers[k] = v; return this; },
      status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    await createPasswordChangeHandler(deps)({ body, user }, res, () => {});
    return res;
  };
  return { calls, run };
}
test("missing current password, mismatch, weak password and bcrypt byte overflow are rejected before writing", async () => {
  for (const body of [
    { ...values, currentPassword: "" },
    { ...values, confirmPassword: "Mismatch" },
    { ...values, newPassword: "weak", confirmPassword: "weak" },
    { ...values, newPassword: values.currentPassword, confirmPassword: values.currentPassword },
    { ...values, newPassword: "Aa1!" + "é".repeat(35), confirmPassword: "Aa1!" + "é".repeat(35) },
  ]) {
    const f = fixture();
    assert.equal((await f.run(body)).statusCode, 400);
    assert.equal(f.calls.writes, 0);
  }
});
test("wrong current password is rejected without changing credentials or revealing secrets", async () => {
  const f = fixture();
  const res = await f.run({ ...values, currentPassword: "Wrong-Password123!" });
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.field, "currentPassword");
  assert.equal(f.calls.writes, 0);
  assert.equal(JSON.stringify(res.body).includes(values.newPassword), false);
});
test("legacy encrypted password can change to a bcrypt password and only its own account is updated", async () => {
  const f = fixture();
  const res = await f.run({ ...values, userId: "someone-else" });
  assert.equal(res.statusCode, 200);
  assert.equal(f.calls.id, "fixture-user");
  assert.equal(f.calls.previous, "legacy-encrypted");
  assert.match(f.calls.hash, /^\$2b\$12\$/);
  assert.equal(await bcrypt.compare(values.newPassword, f.calls.hash), true);
  assert.equal(await bcrypt.compare(values.currentPassword, f.calls.hash), false);
  assert.equal(f.calls.cache, 1);
  assert.equal(res.headers["Cache-Control"], "no-store");
  assert.deepEqual(Object.keys(res.body).sort(), ["message", "success"]);
});
test("existing bcrypt accounts also require the correct current password", async () => {
  const password = await bcrypt.hash(values.currentPassword, 4);
  const f = fixture({ getUser: async () => ({ password }), decryptPassword: () => { throw new Error("Do not decrypt bcrypt"); } });
  assert.equal((await f.run({ ...values, currentPassword: "Incorrect123!" })).statusCode, 400);
  assert.equal((await f.run()).statusCode, 200);
});
test("unauthenticated and passwordless accounts cannot change a password", async () => {
  const f = fixture({ getUser: async () => ({ password: null }) });
  assert.equal((await f.run(values, null)).statusCode, 401);
  assert.equal((await f.run()).statusCode, 400);
  assert.equal(f.calls.writes, 0);
});
test("concurrent password replacement is rejected rather than overwriting newer credentials", async () => {
  const f = fixture({ replacePassword: async () => false });
  assert.equal((await f.run()).statusCode, 409);
  assert.equal(f.calls.cache, 0);
});
test("cache cleanup cannot report a committed password change as failed", async () => {
  const f = fixture({ clearCache: async () => { throw new Error("cache unavailable"); } });
  assert.equal((await f.run()).statusCode, 200);
  assert.equal(f.calls.writes, 1);
});
test("settings no longer load or mask saved passwords and tabs have responsive spacing", () => {
  const source = fs.readFileSync("client/src/components/ProfileSettings.tsx", "utf8");
  assert.doesNotMatch(source, /maskPassword|user\.password|Password Setup|Set Password|verify-pin/);
  assert.match(source, /<ChangePasswordForm/);
  assert.match(source, /grid-cols-2 gap-2.*sm:grid-cols-3 lg:grid-cols-6/);
  const form = fs.readFileSync("client/src/components/ChangePasswordForm.tsx", "utf8");
  assert.match(form, /currentPassword: "", newPassword: "", confirmPassword: ""/);
  assert.match(form, /"text" : "password"/);
  assert.match(form, /retry: false/);
});
test("route integration protects existing credentials and never returns the auth user's stored password", () => {
  const routes = fs.readFileSync("server/routes.ts", "utf8");
  assert.match(routes, /app\.post\('\/api\/auth\/change-password', isAuthenticated, rateLimitService/);
  assert.match(routes, /eq\(users\.password, previous\)/);
  assert.match(routes, /if \(existingUser\.password\)/);
  assert.match(routes, /delete userResponse\.password/);
  assert.match(routes, /securitySetupComplete = !!\(userResponse\.hasPassword/);
});
