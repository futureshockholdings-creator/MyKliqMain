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

  init() {
    if (!('serviceWorker' in navigator)) {
      console.log('[PWAUpdate] Service workers not supported');
      return;
    }

    this.setupActivityTracking();
    this.setupVisibilityHandler();
    this.setupNavigationHandler();
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

    this.idleCheckInterval = window.setInterval(() => {
      if (this.updateAvailable && this.isUserIdle()) {
        console.log('[PWAUpdate] User idle, reloading...');
        this.safeReload();
      }
    }, 5000);
  }

  private setupVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.updateAvailable) {
        console.log('[PWAUpdate] App returned to foreground with update available, reloading...');
        setTimeout(() => this.safeReload(), 500);
      }
    });
  }

  private setupNavigationHandler() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      if (this.updateAvailable) {
        console.log('[PWAUpdate] Navigation detected with update available, reloading...');
        this.safeReload();
        return;
      }
      return originalPushState.apply(history, args);
    };

    history.replaceState = (...args) => {
      if (this.updateAvailable) {
        console.log('[PWAUpdate] Navigation detected with update available, reloading...');
        this.safeReload();
        return;
      }
      return originalReplaceState.apply(history, args);
    };

    window.addEventListener('popstate', () => {
      if (this.updateAvailable) {
        console.log('[PWAUpdate] Back/forward navigation with update available, reloading...');
        setTimeout(() => this.safeReload(), 100);
      }
    });
  }

  private isFirebaseServiceWorker(sw: ServiceWorker | null): boolean {
    if (!sw) return false;
    return sw.scriptURL.includes('firebase-messaging-sw.js');
  }

  private isIOSPushServiceWorker(sw: ServiceWorker | null): boolean {
    if (!sw) return false;
    return sw.scriptURL.includes('sw-ios.js');
  }

  private shouldSkipReloadForWorker(sw: ServiceWorker | null): boolean {
    return this.isFirebaseServiceWorker(sw) || this.isIOSPushServiceWorker(sw);
  }

  private setupServiceWorkerListeners() {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SW_UPDATED') {
        console.log('[PWAUpdate] Service worker updated to:', event.data.version);
        this.handleUpdateAvailable();
      }
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (this.isReloading) return;
      
      const controller = navigator.serviceWorker.controller;
      if (this.shouldSkipReloadForWorker(controller)) {
        console.log('[PWAUpdate] Controller changed to push notification SW - skipping reload');
        return;
      }
      
      if (this.updateAvailable) {
        console.log('[PWAUpdate] Controller changed with update pending, reloading...');
        this.safeReload();
      } else {
        console.log('[PWAUpdate] Controller changed, but no update pending - skipping reload');
      }
    });

    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        if (this.shouldSkipReloadForWorker(newWorker)) {
          console.log('[PWAUpdate] Push notification SW update detected - ignoring');
          return;
        }

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWAUpdate] New service worker installed and waiting');
            this.handleUpdateAvailable();
          }
        });
      });
    });
  }

  private startUpdateChecks() {
    this.checkInterval = window.setInterval(() => {
      navigator.serviceWorker.ready.then((registration) => {
        registration.update().catch((err) => {
          console.log('[PWAUpdate] Update check failed:', err);
        });
      });
    }, 60000);

    navigator.serviceWorker.ready.then((registration) => {
      registration.update();
    });
  }

  private handleUpdateAvailable() {
    if (this.updateAvailable) return;
    
    this.updateAvailable = true;
    this.updateDetectedAt = Date.now();
    console.log('[PWAUpdate] Update available, waiting for safe moment to reload');

    if (this.isUserIdle()) {
      console.log('[PWAUpdate] User already idle, reloading immediately...');
      this.safeReload();
      return;
    }

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

  private safeReload() {
    if (this.isReloading) return;
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
      this.safeReload();
    });
  }

  setToastCallback(callback: UpdateCallback) {
    this.toastCallback = callback;
  }

  forceUpdate() {
    this.safeReload();
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
