import type { RequestHandler } from "express";
import { createHash, timingSafeEqual } from "crypto";

const normalize = (key: string) => key.replace(/[_-]/g, "").toLowerCase();
const secretFields = new Set([
  "password", "passwordhash", "encryptedpassword", "currentpassword", "newpassword", "confirmpassword",
  "securityanswer1", "securityanswer2", "securityanswer3", "securityanswers", "securitypin", "pinhash",
  "answer1", "answer2", "answer3", "pin", "pincode", "passwordsalt", "salt",
  "encryptedtext", "iv", "authtag", "encryptedaccesstoken", "encryptedrefreshtoken",
  "accesstoken", "refreshtoken", "clientsecret", "apisecret", "apikey", "apppassword",
  "consumersecret", "sessionsecret", "encryptionkey", "privatekey", "serviceaccount",
  "encryptedcodeverifier", "codeverifier", "authorization", "cookie",
  "token", "resettoken", "authtoken", "idtoken", "xauthtoken", "xadminpassword",
  "adminpassword", "sid", "sess", "sessionid", "setcookie", "secret", "totpsecret",
  "backupcodes", "recoverycodes", "encryptedapppassword", "encryptedcredentials",
]);
const publicUserFields = new Set([
  "id", "firstName", "lastName", "profileImageUrl", "backgroundImageUrl", "bio",
  "kliqName", "kliqLeftEmoji", "kliqRightEmoji", "kliqClosed", "birthdate",
  "profileMusicUrls", "profileMusicTitles", "interests", "favoriteLocations", "favoriteFoods",
  "musicGenres", "relationshipStatus", "hobbies", "favoriteMovies", "favoriteBooks",
  "petPreferences", "lifestyle", "equippedBorderId", "equippedBorder", "loginStreak", "createdAt", "updatedAt",
  "friendCount", "postCount", "theme",
]);
const ownerUserFields = new Set([
  ...publicUserFields, "email", "phoneNumber", "isAdmin", "isSuspended", "suspensionType",
  "suspendedAt", "suspensionExpiresAt", "termsAcceptedAt", "analyticsConsent", "inviteCode",
]);
interface PrivacyContext {
  ownerId?: string;
  privateAccount?: boolean;
  admin?: boolean;
  log?: boolean;
  protocolFields?: Set<string>;
}

export function protectApiData(value: any, context: PrivacyContext = {}, depth = 0): any {
  if (!value || typeof value !== "object" || value instanceof Date || Buffer.isBuffer(value)) return value;
  if (value instanceof Error) return { name: value.name, message: "Server diagnostic details withheld" };
  if (Array.isArray(value)) return value.map(item => protectApiData(item, context, depth + 1));
  const isUser = typeof value.id === "string" && (
    "password" in value || "securityAnswer1" in value || "securityPin" in value ||
    (("email" in value || "phoneNumber" in value) &&
      ("firstName" in value || "lastName" in value || "profileImageUrl" in value))
  );
  const ownRecord = value.id === context.ownerId;
  const privateRecord = context.admin || (ownRecord && context.privateAccount);
  if (context.log && isUser) return { id: value.id };
  const result: Record<string, any> = {};
  for (const [key, entry] of Object.entries(value)) {
    const normalized = normalize(key);
    // Only a small set of top-level, purpose-specific authentication handoffs
    // may carry a token. Stored/nested tokens are never response data.
    if (secretFields.has(normalized) && !(depth === 0 && context.protocolFields?.has(normalized))) continue;
    if (context.log && ["email", "phonenumber", "phone", "token", "resettoken"].includes(normalized)) continue;
    if (isUser && !(privateRecord ? ownerUserFields : publicUserFields).has(key)) continue;
    if (key === "equippedBorder") {
      // Joined avatar decoration is public display data, not an account secret.
      // Keep only the fields consumed by avatars, never arbitrary nested data.
      const border = entry as Record<string, unknown> | null | undefined;
      result[key] = border && typeof border === "object" && !Array.isArray(border)
        ? Object.fromEntries(
            ["id", "name", "imageUrl"]
              .filter(field => typeof border[field] === "string")
              .map(field => [field, border[field]]),
          )
        : null;
      continue;
    }
    result[key] = protectApiData(entry, context, depth + 1);
  }
  if (isUser && (ownRecord || context.admin) &&
      ("password" in value || "hasPassword" in value || "securityAnswer1" in value || "securityPin" in value)) {
    result.hasPassword = value.hasPassword ?? !!value.password;
    result.hasSecurityAnswer1 = value.hasSecurityAnswer1 ?? !!value.securityAnswer1;
    result.hasSecurityAnswer2 = value.hasSecurityAnswer2 ?? !!value.securityAnswer2;
    result.hasSecurityAnswer3 = value.hasSecurityAnswer3 ?? !!value.securityAnswer3;
    result.hasSecurityAnswers = value.hasSecurityAnswers ??
      !!(result.hasSecurityAnswer1 && result.hasSecurityAnswer2 && result.hasSecurityAnswer3);
    result.hasSecurityPin = value.hasSecurityPin ?? !!value.securityPin;
    result.securitySetupComplete = value.securitySetupComplete ??
      !!(result.hasPassword && result.hasSecurityAnswers && result.hasSecurityPin);
    result.requiresSecuritySetup = value.requiresSecuritySetup ?? !result.securitySetupComplete;
  }
  return result;
}

function matchesAdminCredential(value: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof value !== "string") return false;
  return timingSafeEqual(
    createHash("sha256").update(value).digest(),
    createHash("sha256").update(expected).digest(),
  );
}

// Defense in depth for every JSON endpoint, including nested feed/message users,
// old cached server rows, mobile routes, and endpoints added in the future.
export const apiPrivacyMiddleware: RequestHandler = (req: any, res, next) => {
  if (!req.path.startsWith("/api/")) return next();
  const json = res.json.bind(res);
  res.json = ((body: unknown) => {
    if (res.statusCode >= 500) {
      res.set("Cache-Control", "private, no-store");
      return json({ message: "The request could not be completed. Please try again." });
    }
    const ownerId = res.locals.authenticatedUserId || req.user?.claims?.sub || req.userId;
    const admin = req.path.startsWith("/api/admin/") && matchesAdminCredential(
      req.headers["x-admin-password"] || req.body?.password || req.query?.password,
    );
    const privateAccount = /^\/api\/(?:auth\/(?:user|login|signup)|user\/login|mobile\/(?:auth\/(?:login|register)|user\/profile))\/?$/.test(req.path);
    const protocolFields = new Set<string>();
    if (["/api/user/login", "/api/mobile/auth/login", "/api/auth/signup", "/api/mobile/oauth/replit/callback"].includes(req.path)) protocolFields.add("token");
    if (["/api/auth/forgot-password", "/api/auth/verify-security", "/api/auth/verify-pin"].includes(req.path)) protocolFields.add("resettoken");
    if (privateAccount || admin || /^\/api\/(?:auth|user|friends|messages|group-chats|kliq-feed|posts|social[^/]*|oauth[^/]*|mobile)(?:\/|$)/.test(req.path)) {
      res.set("Cache-Control", "private, no-store");
    }
    return json(protectApiData(body, { ownerId, admin, privateAccount, protocolFields }));
  }) as typeof res.json;
  next();
};

export function installPrivacyLogging(): void {
  for (const method of ["log", "info", "warn", "error", "debug"] as const) {
    const original = console[method].bind(console);
    console[method] = (...args: unknown[]) => {
      const label = typeof args[0] === "string" ? args[0] : "";
      const requestSummary = /\b(?:GET|POST|PUT|PATCH|DELETE) \/api\//.test(label);
      if (!requestSummary && /auth header|authorization|request body|password|security.?answer|security.?pin|credentials|private.?key|access.?token|refresh.?token|client.?secret|user object:/i.test(label)) {
        original("[Security] Sensitive diagnostic omitted");
        return;
      }
      original(...args.map(arg => {
        if (typeof arg !== "string") return protectApiData(arg, { log: true });
        const redacted = arg.replace(/\bBearer\s+[A-Za-z0-9._~+\/=-]+/gi, "Bearer [REDACTED]")
          .replace(/"([^"]+)"\s*:\s*("(?:\\.|[^"\\])*"|[^\s,}]+)/g, (match, key) =>
            secretFields.has(normalize(key)) ? `"${key}":"[REDACTED]"` : match);
        try { return JSON.stringify(protectApiData(JSON.parse(redacted), { log: true })); }
        catch { return redacted; }
      }));
    };
  }
}
