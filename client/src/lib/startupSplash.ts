/** The original HTML splash owns cold mobile startup, never later navigation. */
export function getActiveStartupSplash(): HTMLElement | null {
  if (!document.documentElement.classList.contains("mykliq-mobile-startup")) return null;
  const splash = document.getElementById("mykliq-startup");
  return splash && splash.dataset.state !== "ready" ? splash : null;
}

export function isMemberStartupPath(path: string): boolean {
  return /^\/(?:kliq|events|calendar|actions|messages(?:\/[^/]+)?|group-chat\/[^/]+|profile|user\/[^/]+|themes|settings)?\/?$/.test(path);
}
