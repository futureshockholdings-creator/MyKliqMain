// Run: node --test scripts/validate-pwa-badges.cjs
// Uses simulated worker/OS APIs: no push is sent and no database is modified.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadTS(file, mocks, globals = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(source, {
    exports, console: { log() {}, warn() {}, error() {} }, ...globals,
    require(name) {
      if (!(name in mocks)) throw new Error(`Unexpected import ${name}`);
      return mocks[name];
    },
  }, { filename: file });
  return exports;
}

function makeStorage() {
  const values = new Map();
  const db = {
    createObjectStore() {},
    transaction() {
      const tx = {
        objectStore: () => ({
          get(key) {
            const request = {};
            queueMicrotask(() => { request.result = values.get(key); request.onsuccess(); });
            return request;
          },
          put(value, key) {
            queueMicrotask(() => { values.set(key, value); tx.oncomplete(); });
          },
        }),
      };
      return tx;
    },
  };
  return { open() {
    const request = {};
    queueMicrotask(() => { request.result = db; request.onsuccess(); });
    return request;
  } };
}

function worker(file, { supported = true, denied = false, firebase = false, storage = makeStorage() } = {}) {
  const listeners = {};
  const badges = [];
  const shown = [];
  let background;
  const self = {
    navigator: supported ? {
      async setAppBadge(n) { if (denied) throw new Error('denied'); badges.push(n); },
      async clearAppBadge() { if (denied) throw new Error('denied'); badges.push(0); },
    } : {},
    addEventListener(name, fn) { (listeners[name] ||= []).push(fn); },
    registration: { async showNotification(title, options) { shown.push({ title, options }); } },
    clients: { async claim() {} },
    async skipWaiting() {},
    location: { origin: 'https://example.test' },
  };
  const context = vm.createContext({
    self, indexedDB: storage, URL, Response, caches: {},
    console: { log() {}, warn() {}, error() {} },
    fetch: async () => ({}),
    importScripts(name) {
      if (name === '/assets/app-badge.js') {
        vm.runInContext(fs.readFileSync('client/public/app-badge.js', 'utf8'), context);
      } else if (firebase) {
        context.firebase = {
          initializeApp() {},
          messaging: () => ({ onBackgroundMessage(fn) { background = fn; } }),
        };
      } else throw new Error('Firebase unavailable');
    },
  });
  vm.runInContext(fs.readFileSync(`client/public/${file}`, 'utf8'), context, { filename: file });
  async function emit(name, values) {
    const promises = [];
    const event = { ...values, waitUntil(p) { promises.push(p); } };
    for (const fn of listeners[name] || []) fn(event);
    await Promise.all(promises);
  }
  return {
    badges, shown, self, background: payload => background?.(payload),
    push: payload => emit('push', { data: { json: () => payload, text: () => JSON.stringify(payload) } }),
    message: data => emit('message', { data }),
    emit,
  };
}

const push = (count, time = 200, extra = {}) => ({
  title: 'Post liked', body: 'Someone liked your post',
  data: { unreadCount: count, badgeUpdatedAt: String(time), badgeUserId: 'member-a', notificationId: 'alert-a', ...extra },
});

test('standards contract: closed-app badges use WorkerNavigator, not notification registration', async () => {
  // The mock follows MDN WorkerNavigator.setAppBadge and WebKit's published
  // service-worker push example; ServiceWorkerRegistration has no badge API.
  const w = worker('sw-ios.js');
  assert.equal(w.self.registration.setAppBadge, undefined);
  assert.equal(w.self.registration.clearAppBadge, undefined);
  assert.equal(typeof w.self.navigator.setAppBadge, 'function');
  await w.push(push('6'));
  await w.push(push('0', 300));
  assert.deepEqual(w.badges, [6, 0]);
});

for (const file of ['sw.js', 'sw-ios.js', 'firebase-messaging-sw.js']) {
  test(`${file}: closed-app push sets absolute count, deduplicates counts, clears zero`, async () => {
    const w = worker(file);
    await w.push(push('4'));
    await w.push(push('4'));
    await w.push(push('1', 100)); // older delivery cannot roll count backward
    assert.equal(w.badges.at(-1), 4);
    assert.ok(w.badges.every(n => n === 4));
    assert.equal(w.shown[0].options.tag, 'alert-a');
    await w.push(push('0', 300));
    assert.equal(w.badges.at(-1), 0);
  });
  test(`${file}: unknown or invalid counts never become zero`, async () => {
    const w = worker(file);
    for (const value of [undefined, null, '', '-1', -1, 1.5, 'NaN', true, Number.MAX_VALUE]) {
      await w.push(push(value));
    }
    assert.deepEqual(w.badges, []);
    assert.equal(w.shown.length, 9);
  });
  test(`${file}: missing/denied Badge API still delivers notifications`, async () => {
    for (const options of [{ supported: false }, { denied: true }]) {
      const w = worker(file, options);
      await w.push(push('3'));
      assert.equal(w.shown.length, 1);
    }
  });
}

test('logout survives worker restart; late pushes cannot restore a signed-out badge', async () => {
  const storage = makeStorage();
  const first = worker('sw-ios.js', { storage });
  await first.message({ type: 'APP_BADGE_SYNC', userId: 'member-a', count: 3 });
  await first.message({ type: 'APP_BADGE_LOGOUT' });
  assert.equal(first.badges.at(-1), 0);
  const restarted = worker('sw-ios.js', { storage });
  await restarted.push(push('4'));
  assert.deepEqual(restarted.badges, []);
  assert.equal(restarted.shown.length, 0);
  await restarted.message({ type: 'APP_BADGE_SYNC', userId: 'member-b', count: 0 });
  await restarted.push(push('8')); // old account's delivery
  assert.equal(restarted.badges.at(-1), 0);
  await restarted.push(push('2', 400, { badgeUserId: 'member-b' }));
  assert.equal(restarted.badges.at(-1), 2);
});

test('Firebase data-only delivery has one displayed alert, not the backup plus SDK callback', async () => {
  const w = worker('firebase-messaging-sw.js', { firebase: true });
  const payload = { ...push('5'), from: 'firebase', data: { ...push('5').data, title: 'Post liked', body: 'A like' } };
  await w.push(payload);
  await w.background(payload);
  assert.equal(w.shown.length, 1);
  assert.equal(w.badges.at(-1), 5);
  const automatic = { ...payload, notification: { title: 'Auto-rendered by Firebase' } };
  await w.push(automatic);
  await w.background(automatic);
  assert.equal(w.shown.length, 1); // no additional manual display
});

test('service-worker updates retain badge state and do not intercept API requests', async () => {
  for (const file of ['sw.js', 'sw-ios.js']) {
    const w = worker(file);
    let intercepted = false;
    await w.emit('fetch', {
      request: { url: 'https://example.test/api/notifications', method: 'GET' },
      respondWith() { intercepted = true; },
    });
    assert.equal(intercepted, false);
  }
  const source = fs.readFileSync('client/src/utils/registerServiceWorker.ts', 'utf8');
  assert.match(source, /hasFirebaseWorker/);
  assert.match(source, /updateViaCache: 'none'/);
});

test('foreground lifecycle does not clear on loading, failure, unmount, or ordinary closing', async () => {
  const cases = [
    [{ isLoading: true, isAuthenticated: false }, { isSuccess: false }, null],
    [{ isLoading: false, isAuthenticated: false }, { isSuccess: false }, null],
    [{ isLoading: false, isAuthenticated: true }, { isSuccess: false }, null],
    [{ isLoading: false, isAuthenticated: true }, { isSuccess: true, data: [] }, 0],
    [{ isLoading: false, isAuthenticated: true }, { isSuccess: true, data: [
      { isRead: false, isVisible: true }, { isRead: true, isVisible: true },
      { isRead: false, isVisible: false }, { isRead: false, isVisible: true },
    ] }, 2],
  ];
  for (const [auth, query, expected] of cases) {
    const updates = [];
    const effects = [];
    const hook = loadTS('client/src/hooks/useAppBadge.ts', {
      react: { useEffect: fn => effects.push(fn), useCallback: fn => fn },
      '@tanstack/react-query': { useQuery: () => query },
      '@/hooks/useAuth': { useAuth: () => ({ user: { id: 'member-a' }, ...auth }) },
      '@/lib/appBadge': { syncAppBadge: async (count, id) => updates.push([count, id]) },
    }, { navigator: { setAppBadge() {} } });
    hook.useAppBadge();
    for (const effect of effects) {
      assert.equal(effect(), undefined); // no unmount clear callback
    }
    assert.deepEqual(updates, expected === null ? [] : [[expected, 'member-a']]);
  }
});

test('explicit logout clears and suppresses pending foreground writes until next login', async () => {
  const counts = [];
  const badge = loadTS('client/src/lib/appBadge.ts', {}, {
    navigator: { async setAppBadge(n) { counts.push(n); }, async clearAppBadge() { counts.push(0); } },
  });
  await badge.syncAppBadge(3, 'member-a');
  await badge.clearAppBadgeOnLogout();
  await badge.syncAppBadge(4, 'member-a');
  assert.deepEqual(counts, [3, 0]);
  badge.resumeAppBadgeSession();
  await badge.syncAppBadge(2, 'member-b');
  assert.deepEqual(counts, [3, 0, 2]);
});

test('read-all dismisses managed Android notifications; logout dismisses all app notifications', async () => {
  const w = worker('sw.js', { supported: false });
  const closed = [];
  w.self.registration.getNotifications = async () => [
    { data: { notificationId: 'alert-a' }, close() { closed.push('managed'); } },
    { data: {}, close() { closed.push('broadcast'); } },
  ];
  await w.message({ type: 'APP_BADGE_SYNC', userId: 'member-a', count: 0 });
  assert.deepEqual(closed, ['managed']);
  await w.message({ type: 'APP_BADGE_LOGOUT' });
  assert.deepEqual(closed, ['managed', 'managed', 'broadcast']);
});

test('startup retains the subscribed Firebase worker and uses fresh worker imports', async () => {
  for (const [userAgent, existing, expected] of [
    ['Chrome', 'https://example.test/firebase-messaging-sw.js', '/firebase-messaging-sw.js'],
    ['iPhone Safari', 'https://example.test/sw.js', '/sw-ios.js'],
    ['Chrome', undefined, '/sw.js'],
  ]) {
    let onLoad;
    const registered = [];
    const registration = { scope: '/', active: { scriptURL: existing } };
    const api = loadTS('client/src/utils/registerServiceWorker.ts', {
      '../lib/pwaUpdateManager': { pwaUpdateManager: { init() {} } },
    }, {
      window: { addEventListener: (_, fn) => { onLoad = fn; }, navigator: {} },
      navigator: {
        userAgent, platform: '', maxTouchPoints: 0,
        serviceWorker: {
          getRegistration: async () => existing ? registration : undefined,
          register: async (file, options) => { registered.push([file, options]); return registration; },
        },
      },
    });
    api.registerServiceWorker();
    await onLoad();
    assert.equal(registered[0][0], expected);
    assert.equal(registered[0][1].scope, '/');
    assert.equal(registered[0][1].updateViaCache, 'none');
  }
});

function pwaService({ preferences, unread = 7 } = {}) {
  const delivered = [];
  const table = name => ({ name, userId: 'userId', isActive: 'isActive', isRead: 'isRead', isVisible: 'isVisible' });
  const data = {
    preferences: preferences ? [{ userId: 'member-a', ...preferences }] : [],
    tokens: [
      { userId: 'member-a', isActive: true, token: 'ios-json', platform: 'ios' },
      { userId: 'member-a', isActive: true, token: 'web-fcm', platform: 'web' },
      { userId: 'member-a', isActive: true, token: 'web-fcm', platform: 'web' },
      { userId: 'member-a', isActive: false, token: 'inactive', platform: 'web' },
      { userId: 'member-b', isActive: true, token: 'other-member', platform: 'web' },
      { userId: 'member-a', isActive: true, token: 'native-fcm', platform: 'android' },
      { userId: 'member-a', isActive: true, token: 'ExponentPushToken[example]', platform: 'web' },
    ],
  };
  const service = loadTS('server/pwaNotificationService.ts', {
    'drizzle-orm': {
      eq: (key, value) => row => row[key] === value,
      and: (...conditions) => row => conditions.every(fn => fn(row)),
      or: (...conditions) => row => conditions.some(fn => fn(row)),
      isNull: key => row => row[key] == null,
      count() {}, sql() {},
    },
    './db': { db: { select: () => ({ from: table => ({
      where: async predicate => table.name === 'notifications'
        ? [{ unreadCount: unread, updatedAt: '200' }] : data[table.name].filter(predicate),
    }) }) } },
    '@shared/schema': { deviceTokens: table('tokens'), notificationPreferences: table('preferences'), notifications: table('notifications') },
    './webPushService': { webPushService: {
      isIOSWebPushToken: token => token === 'ios-json',
      sendToMultipleDevices: async (tokens, payload) => { delivered.push({ channel: 'ios', tokens, payload }); return { failureCount: 0 }; },
    } },
    './firebase-notifications': { firebaseNotificationService: {
      sendPwaToMultipleDevices: async (tokens, payload) => { delivered.push({ channel: 'web', tokens, payload }); return { failureCount: 0 }; },
    } },
  });
  return { ...service, delivered };
}

const alert = { userId: 'member-a', id: 'alert-a', isRead: false, isVisible: true, type: 'post_like', title: 'Post liked', message: 'A like', relatedType: 'post', relatedId: 'post-a' };
test('new PWA alert carries authoritative count only to active PWA tokens of its recipient', async () => {
  const service = pwaService();
  await service.sendPwaNotification(alert);
  assert.equal(service.delivered.length, 2);
  for (const { tokens, payload } of service.delivered) {
    assert.equal(tokens.length, 1);
    assert.equal(payload.data.unreadCount, '7');
    assert.equal(payload.data.badgeUserId, 'member-a');
    assert.equal(payload.data.notificationId, 'alert-a');
    assert.equal(payload.data.url, '/post/post-a');
  }
});
test('PWA pushes respect preference opt-outs, snooze, digest, and incognito-only rules', async () => {
  for (const preferences of [
    { pushEnabled: false }, { pushEnabled: true, deliveryPreference: 'daily_digest' },
    { pushEnabled: true, deliveryPreference: 'immediate', likes: false },
    { pushEnabled: true, deliveryPreference: 'immediate', snoozedUntil: new Date(Date.now() + 60000) },
  ]) {
    const service = pwaService({ preferences });
    await service.sendPwaNotification(alert);
    assert.equal(service.delivered.length, 0);
  }
  const service = pwaService();
  await service.sendPwaNotification({ ...alert, type: 'incognito_message' });
  await service.sendPwaNotification({ ...alert, isVisible: false });
  await service.sendPwaNotification({ ...alert, isRead: true });
  assert.equal(service.delivered.length, 0);
  const alreadyRead = pwaService({ unread: 0 });
  await alreadyRead.sendPwaNotification(alert);
  assert.equal(alreadyRead.delivered.length, 0);
});

test('read-state writes invalidate both the bell and typed Redis caches', async () => {
  const removed = [];
  const rows = [{ type: 'post_like' }];
  const chain = { set: () => chain, where: () => chain, returning: async () => rows };
  const { NotificationService } = loadTS('server/notificationService.ts', {
    './db': { db: { update: () => chain, delete: () => chain } },
    '@shared/schema': { notifications: {}, deviceTokens: {} },
    'drizzle-orm': { eq() {}, and() {}, desc() {}, inArray() {} },
    './redis': { deleteCache: async key => removed.push(key) },
    './pwaNotificationService': { sendPwaNotification: async () => {} },
  });
  await new NotificationService().markAsRead('alert-a', 'member-a');
  assert.deepEqual(removed.sort(), ['notifications:member-a:all', 'notifications:member-a:post_like']);
});

test('Firebase PWA multicast is data-only, while existing native notification payloads remain unchanged', async () => {
  const messages = [];
  const { FirebaseNotificationService } = loadTS('server/firebase-notifications.ts', {
    'firebase-admin': { default: {} },
    'firebase-admin/messaging': { getMessaging: () => ({
      async sendEachForMulticast(message) { messages.push(message); return { successCount: 1, failureCount: 0 }; },
      async send(message) { messages.push(message); return 'message-id'; },
    }) },
  }, { process: { env: {} } });
  const service = new FirebaseNotificationService();
  service.initialized = true;
  await service.sendPwaToMultipleDevices(['web'], { title: 'Like', body: 'New like', data: { unreadCount: '1' } });
  assert.equal(messages[0].notification, undefined);
  assert.equal(messages[0].data.title, 'Like');
  assert.equal(messages[0].data.unreadCount, '1');
  await service.sendToDevice('native', { title: 'Native', body: 'Unchanged' });
  assert.equal(messages[1].notification.title, 'Native');
});
