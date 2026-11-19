const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the actual pre-bundle script and React handoff without signing in,
// touching production, or depending on how quickly the development API responds.
const html = fs.readFileSync('client/index.html', 'utf8');
const bootstrap = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const app = fs.readFileSync('client/src/App.tsx', 'utf8');
const handoff = app.slice(app.indexOf('function StartupSplashHandoff()'), app.indexOf('function Navigation('));
const navigationModule = ts.transpileModule(fs.readFileSync('client/src/lib/startupNavigation.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const navigationKey = 'mykliq-startup-navigation';

function environment(userAgent, platform = '', maxTouchPoints = 0, options = {}) {
  const classes = new Set();
  const timers = [];
  const listeners = {};
  const splash = { dataset: {}, removed: false, remove() { this.removed = true; } };
  const document = {
    documentElement: { classList: { add: value => classes.add(value), contains: value => classes.has(value) } },
    getElementById: id => id === 'mykliq-startup' && !splash.removed ? splash : null,
    addEventListener: (type, callback) => { listeners[type] = callback; },
  };
  let reloads = 0;
  let auth = { isLoading: true };
  const storage = options.storage || new Map();
  const sessionStorage = Object.fromEntries(['getItem', 'setItem', 'removeItem'].map(method => [method, (key, value) => {
    if (options.storageBlocked) throw new Error('Storage is blocked');
    if (method === 'getItem') return storage.get(key) ?? null;
    if (method === 'setItem') return storage.set(key, value);
    return storage.delete(key);
  }]));
  const window = {
    setTimeout: (callback, delay) => { timers.push({ callback, delay }); return timers.length; },
    clearTimeout: () => {},
    location: { pathname: options.path || '/', href: options.path || '/', reload() { reloads++; } },
  };
  const context = vm.createContext({
    navigator: { userAgent, platform, maxTouchPoints },
    document, window, sessionStorage, exports: {},
    useAuth: () => auth,
    useEffect: callback => callback(),
  });
  vm.runInContext(bootstrap, context);
  return {
    classes, splash, timers, listeners, storage,
    get reloads() { return reloads; },
    get destination() { return window.location.href; },
    navigate(path) {
      vm.runInContext(navigationModule, context);
      context.exports.navigateWithoutStartupSplash(path);
    },
    settle(result = {}) {
      auth = { isLoading: false, ...result };
      vm.runInContext(`${handoff}\nStartupSplashHandoff();`, context);
    },
    renderLoading() { vm.runInContext(`${handoff}\nStartupSplashHandoff();`, context); },
  };
}

for (const [name, ua, platform, touches] of [
  ['iPhone Safari', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148'],
  ['Android phone browser or installed PWA', 'Mozilla/5.0 (Linux; Android 15) Mobile Safari/537.36'],
  ['Android tablet in landscape', 'Mozilla/5.0 (Linux; Android 15; Tablet) Safari/537.36'],
  ['iPadOS desktop-mode browser', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Safari/605.1', 'MacIntel', 5],
]) {
  test(`${name} receives the pre-React splash`, () => {
    assert.ok(environment(ua, platform, touches).classes.has('mykliq-mobile-startup'));
  });
}

test('desktop browsers and desktop installed PWAs keep existing startup', () => {
  for (const ua of ['Mozilla/5.0 (Windows NT 10.0) Chrome/130.0', 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/605.1']) {
    const env = environment(ua);
    assert.equal(env.classes.size, 0);
    assert.equal(env.timers.length, 0);
    env.settle();
    assert.equal(env.splash.dataset.state, undefined);
  }
});

test('splash remains through auth loading and disappears on the first settled check', () => {
  const env = environment('iPhone');
  env.renderLoading();
  assert.equal(env.splash.dataset.state, undefined);
  env.settle({ isAuthenticated: true });
  assert.equal(env.splash.dataset.state, 'ready');
  const fade = env.timers.find(timer => timer.delay === 220);
  assert.ok(fade);
  fade.callback();
  assert.ok(env.splash.removed);
  env.settle();
  assert.equal(env.timers.filter(timer => timer.delay === 220).length, 1);
});

test('signed-out, 401 and offline outcomes reveal existing app UI', () => {
  for (const result of [{ isAuthenticated: false }, { error: new Error('401 Unauthorized') }, { error: new Error('Offline') }]) {
    const env = environment('iPhone');
    env.settle(result);
    assert.equal(env.splash.dataset.state, 'ready');
  }
});

test('stalled bundle or startup offers recovery after 15 seconds, without auto-reloading', () => {
  const env = environment('Android');
  env.timers.find(timer => timer.delay === 15000).callback();
  assert.equal(env.splash.dataset.state, 'stalled');
  assert.equal(env.reloads, 0);
  env.listeners.click({ target: { closest: () => ({}) } });
  assert.equal(env.reloads, 1);
  env.settle();
  assert.equal(env.splash.dataset.state, 'ready');
});

test('completed startup is not reopened by the watchdog', () => {
  const env = environment('iPhone');
  env.settle();
  env.timers.find(timer => timer.delay === 15000).callback();
  assert.equal(env.splash.dataset.state, 'ready');
});

test('critical shell includes safe areas, reduced motion, recovery and local branding', () => {
  assert.match(html, /env\(safe-area-inset-top\)/);
  assert.match(html, /prefers-reduced-motion: reduce/);
  assert.match(html, /data-mykliq-startup-retry/);
  assert.ok(html.indexOf('id="mykliq-startup"') < html.indexOf('src="/src/main.tsx"'));
  assert.ok(fs.existsSync('client/public/icons/icon-512x512.png'));
  assert.match(html, /#mykliq-startup\s*\{\s*display: none/);
});

test('normal splash copy is only Your Private Social Circle beneath the icon', () => {
  const normalSplash = html.split('<div class="mk-splash-content">')[1].split('<div class="mk-splash-recovery">')[0];
  const visibleText = normalSplash.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  assert.equal(visibleText, 'Your Private Social Circle');
  assert.ok(normalSplash.indexOf('<img ') < normalSplash.indexOf('Your Private Social Circle'));
  assert.doesNotMatch(html, /mk-splash-name|mk-splash-status|Finding your circle|Your people\. Your place\./);
});

for (const [name, destination] of [['successful login', '/'], ['logout', '/landing']]) {
  test(`${name} skips the splash once without suppressing the next cold launch`, () => {
    const source = environment('iPhone');
    source.navigate(destination);
    assert.equal(source.destination, destination);
    assert.ok(source.storage.has(navigationKey));
    const arrival = environment('iPhone', '', 0, { path: destination, storage: source.storage });
    assert.equal(arrival.classes.size, 0);
    assert.equal(arrival.timers.length, 0);
    assert.equal(arrival.storage.has(navigationKey), false);
    const freshLaunch = environment('iPhone', '', 0, { path: '/', storage: source.storage });
    assert.ok(freshLaunch.classes.has('mykliq-mobile-startup'));
  });
}

test('expired, future-dated, malformed and wrong-destination markers cannot hide a fresh splash', () => {
  for (const raw of [
    JSON.stringify({ path: '/', createdAt: Date.now() - 31000 }),
    JSON.stringify({ path: '/', createdAt: Date.now() + 60000 }),
    JSON.stringify({ path: '/landing', createdAt: Date.now() }),
    JSON.stringify({ path: '/', createdAt: String(Date.now()) }),
    'not JSON', 'null',
  ]) {
    const storage = new Map([[navigationKey, raw]]);
    const env = environment('iPhone', '', 0, { storage });
    assert.ok(env.classes.has('mykliq-mobile-startup'));
    assert.equal(storage.has(navigationKey), false);
  }
});

test('blocked session storage does not break startup or auth navigation', () => {
  const env = environment('iPhone', '', 0, { storageBlocked: true });
  assert.ok(env.classes.has('mykliq-mobile-startup'));
  env.navigate('/landing');
  assert.equal(env.destination, '/landing');
});

test('desktop auth redirects still bypass mobile presentation', () => {
  const source = environment('Mozilla/5.0 (Windows NT 10.0) Chrome/130.0');
  source.navigate('/');
  const arrival = environment('Mozilla/5.0 (Windows NT 10.0) Chrome/130.0', '', 0, { storage: source.storage });
  assert.equal(arrival.classes.size, 0);
  assert.equal(arrival.storage.has(navigationKey), false);
});

test('login and both settings exits use the one-shot navigation helper', () => {
  const login = fs.readFileSync('client/src/pages/login.tsx', 'utf8');
  const settings = fs.readFileSync('client/src/pages/settings.tsx', 'utf8');
  assert.match(login, /navigateWithoutStartupSplash\("\/"\)/);
  assert.equal(settings.match(/navigateWithoutStartupSplash\("\/landing"\)/g)?.length, 2);
  assert.doesNotMatch(settings, /window\.location\.href\s*=\s*['"]\/landing/);
});
