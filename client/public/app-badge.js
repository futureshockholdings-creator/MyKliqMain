/* Shared by the classic PWA workers. No auth tokens or API responses are cached. */
(() => {
  let pending = Promise.resolve();
  let memoryState = {};
  let database;

  function countValue(value) {
    if (typeof value === 'string' && !/^\d+$/.test(value)) return null;
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const count = Number(value);
    return Number.isSafeInteger(count) && count >= 0 ? count : null;
  }

  function openDatabase() {
    if (!database) {
      database = new Promise((resolve, reject) => {
        const request = indexedDB.open('mykliq-app-badge', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('state');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return database;
  }

  async function readState() {
    try {
      const db = await openDatabase();
      return await new Promise((resolve, reject) => {
        const request = db.transaction('state').objectStore('state').get('badge');
        request.onsuccess = () => resolve(request.result || {});
        request.onerror = () => reject(request.error);
      });
    } catch {
      return memoryState; // Storage denial must not prevent notification delivery.
    }
  }

  async function saveState(state) {
    memoryState = state;
    try {
      const db = await openDatabase();
      await new Promise((resolve, reject) => {
        const tx = db.transaction('state', 'readwrite');
        tx.objectStore('state').put(state, 'badge');
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } catch (error) {
      console.warn('[AppBadge] Persistent badge state unavailable');
    }
  }

  async function applyCount(count) {
    // The worker API is WorkerNavigator, NOT ServiceWorkerRegistration.
    // WebKit's push example explicitly calls self.navigator.setAppBadge:
    // https://webkit.org/blog/14112/badging-for-home-screen-web-apps/
    // https://developer.mozilla.org/en-US/docs/Web/API/WorkerNavigator/setAppBadge
    // registration owns showNotification/getNotifications, not numeric badges.
    try {
      if (count === 0 && self.navigator?.clearAppBadge) {
        await self.navigator.clearAppBadge();
      } else if (self.navigator?.setAppBadge) {
        await self.navigator.setAppBadge(count);
      }
    } catch {
      // Permissions and OS badge support vary; still deliver the push alert.
      console.warn('[AppBadge] Badge API unavailable or denied');
    }
  }

  function enqueue(operation) {
    const result = pending.then(operation);
    pending = result.catch(() => {});
    return result;
  }

  async function closeNotifications(onlyManaged) {
    if (!self.registration.getNotifications) return;
    try {
      const notifications = await self.registration.getNotifications();
      for (const notification of notifications) {
        if (!onlyManaged || notification.data?.notificationId) notification.close();
      }
    } catch {
      console.warn('[AppBadge] Notification reconciliation unavailable');
    }
  }

  async function acceptPush(payload) {
    return enqueue(async () => {
      const state = await readState();
      const data = payload.data || {};
      const userId = data.badgeUserId;
      if (state.disabled || (userId && state.userId && userId !== state.userId)) return false;
      const count = countValue(data.unreadCount ?? payload.unreadCount);
      const updatedAt = countValue(data.badgeUpdatedAt ?? payload.badgeUpdatedAt);
      // Older delivery must not replace a newer absolute count. Repeated delivery
      // is harmless: the count is set, not incremented.
      if (count !== null && !(updatedAt !== null && updatedAt < (state.lastPushAt || 0))) {
        await saveState({
          ...state,
          userId: userId || state.userId,
          count,
          lastPushAt: updatedAt ?? state.lastPushAt,
        });
        await applyCount(count);
      }
      return true;
    });
  }

  self.addEventListener('message', (event) => {
    const message = event.data;
    if (!['APP_BADGE_SYNC', 'APP_BADGE_LOGOUT'].includes(message?.type)) return;
    const work = enqueue(async () => {
      if (message.type === 'APP_BADGE_LOGOUT') {
        await saveState({ disabled: true });
        await closeNotifications(false);
        await applyCount(0);
      } else {
        const count = countValue(message.count);
        if (count === null || typeof message.userId !== 'string' || !message.userId) return;
        const previous = await readState();
        if (previous.userId && previous.userId !== message.userId) await closeNotifications(false);
        await saveState({
          userId: message.userId,
          disabled: false,
          count,
          lastPushAt: previous.userId === message.userId ? previous.lastPushAt : undefined,
        });
        // Android derives its launcher dot from active system notifications, not
        // the Badging API. Reading all alerts must dismiss our managed alerts.
        if (count === 0) await closeNotifications(true);
        await applyCount(count);
      }
    }).finally(() => event.ports?.[0]?.postMessage({ ok: true }));
    event.waitUntil(work);
  });

  self.mykliqBadge = { acceptPush };
})();
