import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Download, X } from "lucide-react";
import { detectDevice } from "@/lib/deviceDetection";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
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

  return (
    <Dialog open={showDialog} onOpenChange={(open) => {
      if (!open) handleDismiss();
      else setShowIOSSteps(false);
    }}>
      <DialogContent className="bg-card border-border text-foreground max-w-sm mx-auto p-0 gap-0 rounded-2xl overflow-hidden [&>button]:hidden">
        {!showIOSSteps ? (
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
        ) : (
          <div className="flex flex-col items-center text-center p-6">
            <div className="w-16 h-16 rounded-2xl overflow-hidden mb-4 shadow-lg">
              <img 
                src="/icons/icon-192x192.png" 
                alt="MyKliq" 
                className="w-full h-full object-cover"
              />
            </div>

            <h2 className="text-lg font-bold text-foreground mb-1">Install MyKliq</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Follow these steps to add MyKliq to your home screen
            </p>

            <div className="w-full space-y-4 text-left">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Tap the Share button
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Look for the{" "}
                    <span className="inline-flex items-center align-middle">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                    </span>
                    {" "}icon at the bottom of Safari
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Scroll down and tap "Add to Home Screen"
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Look for the{" "}
                    <span className="inline-flex items-center align-middle">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                    </span>
                    {" "}icon in the share menu
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Tap "Add" to install
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    MyKliq will appear on your home screen
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleDismiss}
              className="w-full mt-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl"
              size="lg"
            >
              Got It
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
