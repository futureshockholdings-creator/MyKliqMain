import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { uiText, useUiLanguage } from "@/i18n/interfaceText";

type RouteLoadingScreenProps = {
  hasError?: boolean;
  isRetrying?: boolean;
  showBranding?: boolean;
  onRetry: () => void;
  onHome: () => void;
};

const SLOW_MESSAGE =
  "This is taking longer than expected. Please check your connection.";
const ERROR_MESSAGE = "We couldn’t load this page. Please try again.";

export default function RouteLoadingScreen({
  hasError = false,
  isRetrying = false,
  showBranding = true,
  onRetry,
  onHome,
}: RouteLoadingScreenProps) {
  const language = useUiLanguage();
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    setIsSlow(false);
    const timeout = window.setTimeout(() => setIsSlow(true), 5000);
    return () => window.clearTimeout(timeout);
  }, [isRetrying]);

  const showHome = hasError || isSlow;

  return (
    <main
      lang={language}
      className="fixed inset-0 z-40 flex min-h-[100dvh] w-full items-center justify-center overflow-y-auto bg-white px-6 py-12"
      style={{
        backgroundColor: "#ffffff",
        color: "#26313d",
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <section className="flex w-full max-w-sm flex-col items-center text-center">
        {showBranding && (
          <div className="relative mb-8 flex h-28 w-28 items-center justify-center">
            <div
              aria-hidden="true"
              className="absolute inset-1 rounded-[2rem] bg-[#f4f7fb]"
            />
            <img
              src="/icons/icon-512x512.png"
              alt="MyKliq"
              className="relative h-20 w-20 rounded-[1.35rem] object-contain"
              draggable={false}
            />
          </div>
        )}

        {hasError ? (
          <div role="alert" aria-live="assertive" className="w-full">
            <h1 className="text-balance text-lg font-semibold leading-7 tracking-[-0.02em] text-[#26313d]">
              {uiText(ERROR_MESSAGE)}
            </h1>
            <div className="mt-7 flex w-full flex-col gap-3">
              <Button
                type="button"
                onClick={onRetry}
                disabled={isRetrying}
                className="h-12 rounded-xl bg-[#344f69] px-6 font-semibold text-white hover:bg-[#293f55] disabled:cursor-not-allowed"
              >
                {uiText("Try Again")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onHome}
                className="h-12 rounded-xl border-[#d9e0e7] bg-white px-6 font-semibold text-[#344f69] hover:bg-[#f6f8fa] hover:text-[#26313d]"
              >
                {uiText("Home")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center" role="status" aria-live="polite" aria-atomic="true">
            <p className="text-base font-semibold tracking-[-0.015em] text-[#344f69]">
              {uiText(isSlow ? SLOW_MESSAGE : "Loading MyKliq…")}
            </p>
            {!isSlow && (
              <div
                aria-hidden="true"
                className="mt-6 flex h-1 w-20 overflow-hidden rounded-full bg-[#e9eef3]"
              >
                <span className="h-full w-1/2 origin-left animate-pulse rounded-full bg-[#708aa3] motion-reduce:animate-none" />
              </div>
            )}
            {showHome && (
              <Button
                type="button"
                variant="outline"
                onClick={onHome}
                className="mt-7 h-11 rounded-xl border-[#d9e0e7] bg-white px-6 font-semibold text-[#344f69] hover:bg-[#f6f8fa] hover:text-[#26313d]"
              >
                {uiText("Home")}
              </Button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
