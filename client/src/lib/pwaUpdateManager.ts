import { withDeadline } from "./withDeadline";

type UpdateCallback = () => void;

class PWAUpdateManager {
  private updateAvailable = false;
  private lastActivity = Date.now();
  private idleThreshold = 30000;
  private maxWaitTime = 300000;
  private updateDetectedAt: number | null = null;
  private checkInterval: number | null = null;
  private idleCheckInterval: number | null = null;
  private toastCallback: UpdateCallback | null = null;
  private isReloading = false;
  private initialized = false;
  private checkingRelease = false;
  private targetVersion: string | null = null;
  private hasEditedContent = false;
  private registration: ServiceWorkerRegistration | null = null;

  init() {
    if (this.initialized || !('serviceWorker' in navigator)) {
      console.log('[PWAUpdate] Service workers not supported');
      return;
    }
    this.initialized = true;

    this.setupActivityTracking();
    this.setupVisibilityHandler();
    this.setupServiceWorkerListeners();
    this.startUpdateChecks();
    
    console.log('[PWAUpdate] Update manager initialized');
  }

  private setupActivityTracking() {
    const updateActivity = () => {
      this.lastActivity = Date.now();
    };

    ['click', 'keydown', 'scroll', 'touchstart', 'mousemove'].forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
    // Conservatively retain this flag for the document's lifetime. An update
    // must not guess that an upload, recording, or edited form is safely saved.
    ['input', 'change', 'submit'].forEach(event => {
      document.addEventListener(event, () => { this.hasEditedContent = true; }, true);
    });

    this.idleCheckInterval = window.setInterval(() => {
      if (this.updateAvailable && this.isUserIdle() &&
          document.documentElement.dataset.mykliqAppReady !== "true") {
        console.log('[PWAUpdate] User idle, reloading...');
        this.safeReload();
      }
    }, 5000);
  }

  private setupVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        void this.checkRelease();
        if (this.updateAvailable) this.showUpdateToast();
      }
    });
    window.addEventListener("mykliq:app-ready", () => {
      if (this.updateAvailable) this.showUpdateToast();
    });
    window.addEventListener("mykliq:asset-failed", () => {
      // A late chunk failure must not refresh over a member's draft.
      void this.checkRelease();
      this.showUpdateToast();
    });
  }

  /** Keep the subscribed worker, but observe updates for every worker type. */
  watchRegistration(registration: ServiceWorkerRegistration) {
    if (this.registration === registration) return;
    this.registration = registration;
    const watch = (worker: ServiceWorker | null) => {
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "activated") void this.checkRelease();
      });
    };
    watch(registration.installing);
    watch(registration.waiting);
    registration.addEventListener("updatefound", () => watch(registration.installing));
    void registration.update().catch(() => {});
    void this.checkRelease();
  }

  private setupServiceWorkerListeners() {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SW_UPDATED') {
        void this.checkRelease();
      }
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!this.isReloading) void this.checkRelease();
    });
  }

  private startUpdateChecks() {
    this.checkInterval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void this.registration?.update().catch(() => {});
      void this.checkRelease();
    }, 60000);
    void this.checkRelease();
  }

  private async checkRelease() {
    if (!import.meta.env.PROD || this.checkingRelease || !navigator.onLine) return;
    const current = document.querySelector<HTMLMetaElement>('meta[name="mykliq-build"]')?.content;
    if (!current) return;
    this.checkingRelease = true;
    const controller = new AbortController();
    try {
      const release = await withDeadline((async () => {
        const response = await fetch(`/assets/app-release.json?t=${Date.now()}`, {
          cache: "no-store", signal: controller.signal,
        });
        if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) return null;
        return await response.json();
      })(), 6000, "Update check timed out.", () => controller.abort());
      if (!release || typeof release.version !== "string" ||
          !/^\d{13}-[a-f0-9-]{36}$/.test(release.version)) return;
      // Reject stale CDN metadata rather than refresh toward an older release.
      if (release.version === current || Number(release.version.split("-")[0]) <
          Number(current.split("-")[0])) return;
      this.targetVersion = release.version;
      this.handleUpdateAvailable();
    } catch {
      // Updates are optional background work, never a prerequisite for startup.
    } finally {
      this.checkingRelease = false;
    }
  }

  private handleUpdateAvailable() {
    if (this.updateAvailable) return;
    
    this.updateAvailable = true;
    this.updateDetectedAt = Date.now();
    console.log('[PWAUpdate] Update available, waiting for safe moment to reload');

    if (document.documentElement.dataset.mykliqAppReady !== "true") {
      this.safeReload();
      return;
    }
    this.showUpdateToast();

    setTimeout(() => {
      if (this.updateAvailable && !this.isReloading) {
        console.log('[PWAUpdate] Max wait time reached, showing toast');
        this.showUpdateToast();
      }
    }, this.maxWaitTime);
  }

  private isUserIdle(): boolean {
    return Date.now() - this.lastActivity > this.idleThreshold;
  }

  private safeReload(userInitiated = false) {
    if (this.isReloading) return;
    if (!userInitiated && (this.hasEditedContent ||
        document.documentElement.dataset.mykliqAppReady === "true")) {
      this.showUpdateToast();
      return;
    }
    if (userInitiated && this.hasEditedContent &&
        !window.confirm("Updating reloads MyKliq and may discard unsaved changes or interrupt an upload. Update now?")) return;
    if (!userInitiated) {
      if (!this.targetVersion || !navigator.onLine) return;
      try {
        const key = `mykliq-update-reloaded:${this.targetVersion}`;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
      } catch {
        // Without a persistent loop guard, require an explicit Update action.
        return;
      }
    }
    this.isReloading = true;
    
    if (this.checkInterval) clearInterval(this.checkInterval);
    if (this.idleCheckInterval) clearInterval(this.idleCheckInterval);
    
    window.location.reload();
  }

  private showUpdateToast() {
    if (this.toastCallback) {
      this.toastCallback();
    } else {
      this.createDefaultToast();
    }
  }

  private createDefaultToast() {
    const existing = document.getElementById('pwa-update-toast');
    if (existing) return;

    const toast = document.createElement('div');
    toast.id = 'pwa-update-toast';
    toast.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        animation: slideUp 0.3s ease-out;
      ">
        <span>New version available</span>
        <button id="pwa-update-btn" style="
          background: white;
          color: #667eea;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
        ">Update</button>
      </div>
      <style>
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(100px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      </style>
    `;
    document.body.appendChild(toast);

    document.getElementById('pwa-update-btn')?.addEventListener('click', () => {
      this.safeReload(true);
    });
  }

  setToastCallback(callback: UpdateCallback) {
    this.toastCallback = callback;
  }

  forceUpdate() {
    this.safeReload(true);
  }

  isUpdatePending(): boolean {
    return this.updateAvailable;
  }

  destroy() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    if (this.idleCheckInterval) clearInterval(this.idleCheckInterval);
  }
}

export const pwaUpdateManager = new PWAUpdateManager();
