/**
 * Authentication transitions reload the document to preserve existing auth and
 * cleanup behavior. They are not cold app launches. This marker is presentation
 * only: it contains no credentials and grants no access.
 */
export function navigateWithoutStartupSplash(path: "/" | "/landing"): void {
  try {
    sessionStorage.setItem("mykliq-startup-navigation", JSON.stringify({
      path,
      createdAt: Date.now(),
    }));
  } catch {
    // Storage restrictions must never prevent login/logout navigation.
  }
  window.location.href = path;
}
