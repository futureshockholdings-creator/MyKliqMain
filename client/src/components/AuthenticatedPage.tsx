import type { ReactNode } from "react";
import { Redirect, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import RouteLoadingScreen from "@/components/RouteLoadingScreen";

interface AuthenticatedPageProps {
  children: ReactNode;
  signedOut?: ReactNode;
}

/** Keep known member routes registered while their session is being checked. */
export function AuthenticatedPage({ children, signedOut }: AuthenticatedPageProps) {
  const { user, isLoading, isFetching, error, retryAuth } = useAuth();
  const [, navigate] = useLocation();

  // Cached, authenticated content stays mounted during background refreshes,
  // including temporary network failures. Server authorization still applies.
  if (user) return <>{children}</>;

  // Logout intentionally clears the query cache before its final redirect.
  // Do not show recovery/splash UI in that short, deliberate signed-out gap.
  let loggingOut = false;
  try {
    loggingOut = sessionStorage.getItem("forceLogout") === "true";
  } catch {
    // Restricted storage must not prevent normal session recovery.
  }
  if (loggingOut) return <Redirect to="/landing" />;

  if (isLoading || error) {
    return (
      <RouteLoadingScreen
        hasError={!!error && !isFetching}
        isRetrying={isFetching}
        showBranding={document.documentElement.dataset.mykliqStartupSuppressed !== "true"}
        onRetry={() => { void retryAuth(); }}
        onHome={() => navigate("/login")}
      />
    );
  }

  // A confirmed signed-out session is not a missing page.
  return signedOut !== undefined ? <>{signedOut}</> : <Redirect to="/login" />;
}
