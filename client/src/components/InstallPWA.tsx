import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Download, X } from "lucide-react";
import { detectDevice } from "@/lib/deviceDetection";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function IOSBanner({ onInstall, onDismiss, showSteps }: { onInstall: () => void; onDismiss: () => void; showSteps: boolean }) {
  if (showSteps) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-gray-100 border-b border-gray-300 shadow-md">
        <div className="px-3 py-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-900">Install MyKliq</span>
            <button onClick={onDismiss} className="text-gray-500 hover:text-gray-700 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 text-black flex items-center justify-center font-bold text-xs">1</span>
              <p className="text-xs text-gray-700">
                Tap the{" "}
                <span className="inline-flex items-center align-middle">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </span>
                {" "}Share button in Safari
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 text-black flex items-center justify-center font-bold text-xs">2</span>
              <p className="text-xs text-gray-700">Tap "Add to Home Screen"</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 text-black flex items-center justify-center font-bold text-xs">3</span>
              <p className="text-xs text-gray-700">Tap "Add" to install</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-gray-100 border-b border-gray-300 shadow-md">
      <div className="flex items-center px-3 py-2.5 gap-3">
        <button onClick={onDismiss} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden shadow-sm">
          <img 
            src="/icons/icon-192x192.png" 
            alt="MyKliq" 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">MyKliq</p>
          <p className="text-xs text-gray-500 leading-tight mt-0.5">Your Private Social Circle</p>
        </div>

        <button
          onClick={onInstall}
          className="flex-shrink-0 bg-green-500 hover:bg-green-600 text-black font-semibold text-sm px-4 py-1.5 rounded-full transition-colors"
        >
          Install
        </button>
      </div>
    </div>
  );
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const device = detectDevice();
  const isIOS = device.isIOS;

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      const daysSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => {
      setIsInstalled(true);
      setShowDialog(false);
      localStorage.removeItem('pwa-install-dismissed');
    };

    window.addEventListener('appinstalled', installedHandler);

    const timer = setTimeout(() => {
      setShowDialog(true);
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSSteps(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] User ${outcome} the install prompt`);
      setDeferredPrompt(null);
      setShowDialog(false);
      if (outcome === 'dismissed') {
        localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
      }
    }
  };

  const handleDismiss = () => {
    setShowDialog(false);
    setShowIOSSteps(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  const shouldShow = !isInstalled && showDialog && (isIOS || deferredPrompt);

  if (!shouldShow) {
    return null;
  }

  if (isIOS) {
    return (
      <IOSBanner
        onInstall={handleInstallClick}
        onDismiss={handleDismiss}
        showSteps={showIOSSteps}
      />
    );
  }

  return (
    <Dialog open={showDialog} onOpenChange={(open) => {
      if (!open) handleDismiss();
    }}>
      <DialogContent className="bg-card border-border text-foreground max-w-sm mx-auto p-0 gap-0 rounded-2xl overflow-hidden [&>button]:hidden">
        <div className="flex flex-col items-center text-center p-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mb-4 shadow-lg">
            <img 
              src="/icons/icon-192x192.png" 
              alt="MyKliq" 
              className="w-full h-full object-cover"
            />
          </div>

          <h2 className="text-xl font-bold text-foreground mb-1">Install MyKliq</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Add MyKliq to your home screen for quick access and a better experience
          </p>

          <div className="w-full space-y-3">
            <Button
              onClick={handleInstallClick}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl"
              size="lg"
            >
              <Download className="w-5 h-5 mr-2" />
              Install App
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground"
              size="lg"
            >
              Not Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
