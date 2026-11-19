const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const code = ts.transpileModule(fs.readFileSync('client/src/hooks/useSignupSteps.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

function setup() {
  const values = [];
  const effects = [];
  const listeners = new Set();
  const entries = [{ url: '/landing', state: null }, { url: '/signup?inviteCode=test-invite', state: { existing: true } }];
  let cursor = 0;
  let index = 1;
  const window = {
    location: { get href() { return entries[index].url; } },
    addEventListener: (_, fn) => listeners.add(fn),
    removeEventListener: (_, fn) => listeners.delete(fn),
    history: {
      get state() { return entries[index].state; },
      replaceState: (state, _, url) => { entries[index] = { state, url }; },
      pushState: (state, _, url) => { entries.splice(++index, entries.length, { state, url }); },
      back() { if (index > 0) { index--; listeners.forEach(fn => fn({ state: entries[index].state })); } },
      forward() { if (index < entries.length - 1) { index++; listeners.forEach(fn => fn({ state: entries[index].state })); } },
    },
  };
  const react = {
    useState(initial) {
      const slot = cursor++;
      if (!(slot in values)) values[slot] = typeof initial === 'function' ? initial() : initial;
      return [values[slot], value => { values[slot] = value; }];
    },
    useCallback: callback => callback,
    useEffect(effect) { const slot = cursor++; if (!effects[slot]) effects[slot] = { effect }; },
  };
  const context = vm.createContext({ exports: {}, require: () => react, window, crypto: { randomUUID: () => 'test-flow' } });
  vm.runInContext(code, context);
  function render() {
    cursor = 0;
    const result = context.exports.useSignupSteps();
    effects.forEach(entry => {
      if (!entry.ran) { entry.ran = true; entry.cleanup = entry.effect(); }
    });
    return result;
  }
  return { render, window, entries, cleanup: () => effects.forEach(entry => entry.cleanup?.()) };
}

test('browser Back moves through signup steps without leaving the signup URL', () => {
  const env = setup();
  env.render().goToStep(2);
  env.render().goToStep(3);
  env.window.history.back();
  assert.equal(env.render().currentStep, 2);
  env.window.history.back();
  assert.equal(env.render().currentStep, 1);
  assert.equal(env.window.location.href, '/signup?inviteCode=test-invite');
});

test('on-page Back uses the same history and supports Forward', () => {
  const env = setup();
  env.render().goToStep(2);
  env.render().goToStep(3);
  env.render().goBack();
  assert.equal(env.render().currentStep, 2);
  env.window.history.forward();
  assert.equal(env.render().currentStep, 3);
});

test('editing and advancing again replaces the abandoned forward branch', () => {
  const env = setup();
  env.render().goToStep(2);
  env.render().goToStep(3);
  env.render().goBack();
  env.render().goToStep(3);
  assert.equal(env.render().currentStep, 3);
  assert.equal(env.entries.length, 4);
});

test('first-step on-page Back does nothing and browser Back can still leave signup', () => {
  const env = setup();
  env.render().goBack();
  assert.equal(env.window.location.href, '/signup?inviteCode=test-invite');
  env.window.history.back();
  assert.equal(env.window.location.href, '/landing');
});

test('history records only step metadata and preserves unrelated router state', () => {
  const env = setup();
  env.render().goToStep(2);
  assert.equal(env.window.history.state.existing, true);
  assert.deepEqual(Object.keys(env.window.history.state.mykliqSignupStep).sort(), ['flowId', 'step']);
  assert.equal(env.window.history.state.mykliqSignupStep.step, 2);
  env.cleanup();
});
