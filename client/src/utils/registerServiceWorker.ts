import { pwaUpdateManager } from '../lib/pwaUpdateManager';

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('[PWA] Service Worker registered:', registration.scope);
          
          pwaUpdateManager.init();
        })
        .catch(error => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error('[PWA] Service Worker unregistration failed:', error);
      });
  }
}
