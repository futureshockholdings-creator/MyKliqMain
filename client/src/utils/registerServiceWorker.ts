import { pwaUpdateManager } from '../lib/pwaUpdateManager';

// Detect iOS Safari PWA (installed to home screen)
function isIOSSafariPWA(): boolean {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = (window.navigator as any).standalone === true;
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);
  return isIOS && (isStandalone || isSafari);
}

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Use sw-ios.js for iOS Safari PWA (has push handler), sw.js for others
      const swFile = isIOSSafariPWA() ? '/sw-ios.js' : '/sw.js';
      
      navigator.serviceWorker
        .register(swFile)
        .then(registration => {
          console.log(`[PWA] Service Worker registered (${swFile}):`, registration.scope);
          
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
