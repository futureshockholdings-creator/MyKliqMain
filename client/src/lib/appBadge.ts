// Badge updates are absolute counts, never increments. Repeated pushes/refetches
// must not inflate the icon count.
let signedOut = false;
let pending = Promise.resolve();

export async function writeAppBadge(count: number): Promise<void> {
  if (!Number.isSafeInteger(count) || count < 0 || typeof navigator === "undefined") return;
  try {
    if (count === 0 && navigator.clearAppBadge) {
      await navigator.clearAppBadge();
    } else {
      await navigator.setAppBadge?.(count);
    }
  } catch (error) {
    console.warn("[AppBadge] Badge API unavailable or denied:", error);
  }
}

async function notifyWorker(message: Record<string, unknown>): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    // Do not wait on .ready: it never resolves if no worker is registered.
    const registration = await navigator.serviceWorker.getRegistration("/");
    const worker = registration?.active;
    if (!worker) return;
    await new Promise<void>((resolve) => {
      const channel = new MessageChannel();
      const finish = () => {
        clearTimeout(timer);
        channel.port1.close();
        resolve();
      };
      const timer = setTimeout(finish, 1500);
      channel.port1.onmessage = finish;
      worker.postMessage(message, [channel.port2]);
    });
  } catch (error) {
    console.warn("[AppBadge] Worker sync unavailable:", error);
  }
}

export function resumeAppBadgeSession() {
  signedOut = false;
}

export function syncAppBadge(count: number, userId: string): Promise<void> {
  pending = pending.then(async () => {
    if (signedOut) return;
    await Promise.all([
      writeAppBadge(count),
      notifyWorker({ type: "APP_BADGE_SYNC", count, userId }),
    ]);
  });
  return pending;
}

export function clearAppBadgeOnLogout(): Promise<void> {
  signedOut = true;
  pending = pending.then(async () => {
    await Promise.all([
      writeAppBadge(0),
      notifyWorker({ type: "APP_BADGE_LOGOUT" }),
    ]);
  });
  return pending;
}
