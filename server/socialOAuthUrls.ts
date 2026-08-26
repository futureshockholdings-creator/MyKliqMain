const DEFAULT_MOBILE_REDIRECT_URI = "mykliq://oauth/callback";

function withoutTrailingSlash(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export function getServerBaseUrl(): string {
  const configured = process.env.BASE_URL?.trim();
  if (configured) return withoutTrailingSlash(configured);

  const replitDomain = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  if (replitDomain) return `https://${replitDomain}`;

  return "http://localhost:5000";
}

export function getWebOAuthRedirectUri(platform: string): string {
  return `${getServerBaseUrl()}/api/oauth/callback/${platform}`;
}

export function getMobileOAuthRedirectUri(): string {
  return process.env.MOBILE_OAUTH_REDIRECT_URI?.trim() || DEFAULT_MOBILE_REDIRECT_URI;
}

function isTrustedAppOrigin(candidate: string): boolean {
  try {
    const url = new URL(candidate);
    if (!["https:", "http:"].includes(url.protocol)) return false;

    const configuredAppUrl = process.env.FRONTEND_URL?.trim();
    if (configuredAppUrl && withoutTrailingSlash(candidate) === withoutTrailingSlash(configuredAppUrl)) {
      return true;
    }

    const hostname = url.hostname.toLowerCase();
    return hostname === "mykliq.app"
      || hostname === "www.mykliq.app"
      || hostname.endsWith(".replit.dev")
      || hostname.endsWith(".replit.app")
      || hostname === "localhost"
      || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export function getAppReturnUrl(requestOrigin?: string): string {
  const configuredAppUrl = process.env.FRONTEND_URL?.trim();
  if (configuredAppUrl) return withoutTrailingSlash(configuredAppUrl);
  if (requestOrigin && isTrustedAppOrigin(requestOrigin)) return withoutTrailingSlash(requestOrigin);

  // Production serves the frontend at mykliq.app while OAuth callbacks land on
  // api.mykliq.app. A provider callback has no browser Origin header, so this
  // fallback must never send the member to the API host's nonexistent Settings
  // page.
  try {
    if (new URL(getServerBaseUrl()).hostname === "api.mykliq.app") {
      return "https://mykliq.app";
    }
  } catch {
    // Fall back to the server origin below for malformed local configuration.
  }

  return getServerBaseUrl();
}