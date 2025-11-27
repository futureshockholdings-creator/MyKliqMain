import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    try {
      return await client.discovery(
        new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
        process.env.REPL_ID!
      );
    } catch (error) {
      console.error("Failed to discover OIDC config:", error);
      throw error;
    }
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    // Don't include profileImageUrl - preserve existing values for returning users,
    // new users will get NULL by default
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  let config;
  try {
    config = await getOidcConfig();
    console.log("Successfully configured OIDC");
  } catch (error) {
    console.error("Failed to setup OIDC config:", error);
    throw error;
  }

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    try {
      const strategy = new Strategy(
        {
          name: `replitauth:${domain}`,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      console.log(`Configured auth strategy for domain: ${domain}`);
      console.log(`Available strategies after registration:`, Object.keys((passport as any)._strategies || {}));
    } catch (error) {
      console.error(`Failed to configure auth strategy for domain ${domain}:`, error);
      throw error;
    }
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    console.log(`Login attempt - hostname: ${req.hostname}, looking for strategy: replitauth:${req.hostname}`);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      // Destroy the session completely
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        }
        // Clear the session cookie
        res.clearCookie('connect.sid');
        
        // Redirect to Replit logout, then back to landing page
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}/landing`,
          }).href
        );
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  
  // Debug logging for session issues (reduced verbosity)
  const hasCookies = !!req.headers.cookie;
  
  // First try session-based auth
  if (req.isAuthenticated() && user?.expires_at) {
    // Session auth succeeded, continue with suspension check
  } else {
    // Session auth failed, try JWT token fallback
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { verifyMobileToken } = await import('./mobile-auth');
        const payload = verifyMobileToken(token);
        
        // Get user from database
        const dbUser = await storage.getUser(payload.userId);
        if (dbUser) {
          // Create a user session object compatible with Passport
          (req as any).user = {
            claims: {
              sub: dbUser.id,
              email: dbUser.email,
              first_name: dbUser.firstName,
              last_name: dbUser.lastName,
              profile_image_url: dbUser.profileImageUrl
            },
            access_token: 'jwt-token-auth',
            refresh_token: null,
            expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
          };
          console.log("JWT auth succeeded for user:", payload.userId);
        } else {
          console.log("JWT auth failed - user not found:", payload.userId);
          return res.status(401).json({ message: "Unauthorized" });
        }
      } catch (tokenError) {
        console.log("JWT auth failed - invalid token");
        return res.status(401).json({ message: "Unauthorized" });
      }
    } else {
      console.log("Auth failed - no session, no JWT. Cookies present:", hasCookies);
      return res.status(401).json({ message: "Unauthorized" });
    }
  }
  
  // Get the user (either from session or JWT)
  const authUser = (req as any).user;

  // Check if user is suspended
  try {
    const dbUser = await storage.getUser(authUser.claims?.sub || authUser.id);
    if (dbUser && dbUser.isSuspended) {
      // Auto-check if suspension has expired
      if (dbUser.suspensionExpiresAt && new Date() > new Date(dbUser.suspensionExpiresAt)) {
        // Suspension has expired, unsuspend the user
        await storage.checkAndUnsuspendExpiredUsers();
        // Re-fetch user to get updated status
        const updatedUser = await storage.getUser(authUser.claims?.sub || authUser.id);
        if (updatedUser && updatedUser.isSuspended) {
          return res.status(403).json({ message: "Account suspended" });
        }
      } else {
        // User is still suspended
        const expiresAt = dbUser.suspensionExpiresAt 
          ? new Date(dbUser.suspensionExpiresAt).toLocaleDateString()
          : "permanently";
        return res.status(403).json({ 
          message: "Account suspended",
          details: `Your account is suspended until ${expiresAt}`,
          suspensionType: dbUser.suspensionType
        });
      }
    }
  } catch (error) {
    console.error("Error checking user suspension status:", error);
    // Continue with authentication check rather than blocking on error
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= authUser.expires_at) {
    return next();
  }

  // JWT tokens don't need refresh - they're already validated
  if (authUser.access_token === 'jwt-token-auth') {
    return next();
  }

  const refreshToken = authUser.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(authUser, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
