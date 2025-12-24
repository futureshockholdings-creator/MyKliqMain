import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { startBirthdayService } from "./birthdayService";
import { startMoodBoostScheduler } from "./services/moodBoostScheduler";
import { startReferralBonusService } from "./referralBonusService";
import { seedBorders } from "./seedBorders";
import { seedMemes } from "./seedMemes";
import { reconcileAllUsersWithStreaks } from "./borderReconciliation";
import { setupVite, serveStatic, log } from "./vite";
import { performanceOptimizer } from "./performanceOptimizer";
import { rateLimitService } from "./rateLimitService";
import { firebaseNotificationService } from "./firebase-notifications";

const app = express();

// CORS configuration for mobile and cross-origin requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "https://kliqlife.com",
    "https://www.kliqlife.com",
    "https://api.kliqlife.app",
    "https://mykliq.app",
    "https://www.mykliq.app",
    "https://api.mykliq.app",
    "http://localhost:5000",
    "http://localhost:5173",
    "http://127.0.0.1:5000",
    "http://0.0.0.0:5000",
    "http://172.31.65.34:5000",
    "https://main.d1dc1ug0nbi5ry.amplifyapp.com",
    // Replit dev domain
    process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : null,
    // Replit production deployment URL
    "https://my-kliq-futureshock.replit.app",
  ].filter(Boolean) as string[];

  // Log CORS debug info for troubleshooting
  if (origin && !allowedOrigins.includes(origin)) {
    console.log(`[CORS] Rejected origin: ${origin}`);
  }

  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else if (!origin) {
    // Allow same-origin requests (no origin header)
    res.header("Access-Control-Allow-Origin", "*");
  } else {
    // For unknown origins, still allow but log it
    // This helps with debugging while not breaking functionality
    res.header("Access-Control-Allow-Origin", origin);
    console.log(`[CORS] Allowing unknown origin for debugging: ${origin}`);
  }

  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie, x-admin-password",
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Max-Age", "86400"); // 24 hours
  // Expose headers so JavaScript can read them (critical for Safari cross-origin)
  res.header("Access-Control-Expose-Headers", "X-Auth-Token, Authorization");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// Performance optimizations for 5000+ concurrent users
app.use(performanceOptimizer.responseTimeMiddleware());
app.use(performanceOptimizer.memoryOptimizationMiddleware());

// Optimize Express settings for production scaling
app.use(express.json({ limit: "50mb" })); // Set payload limit for large metadata
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// Production-ready request logging (no PII exposure)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Only log method, path, status, and timing - never response bodies
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

// Health check endpoint for UptimeRobot (registered BEFORE Vite to avoid catch-all)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Serve demo screenshots BEFORE Vite catches all requests
  app.use("/demo-screenshots", express.static(path.join(process.cwd(), "public", "demo-screenshots")));

  // Serve static assets (memes, borders) in both dev and production
  // In production, assets are copied to dist/attached_assets during build
  // Use dist path if it exists (production), otherwise use root path (development)
  const distAssetsPath = path.join(process.cwd(), "dist", "attached_assets");
  const rootAssetsPath = path.join(process.cwd(), "attached_assets");
  const fs = await import("fs");
  const assetsPath = fs.existsSync(distAssetsPath) ? distAssetsPath : rootAssetsPath;
  log(`Serving static assets from: ${assetsPath}`);
  app.use("/attached_assets", express.static(assetsPath, {
    maxAge: "1d",
    etag: true,
  }));

  // Setup Vite in development, serve static files in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // Use static file serving in production (no catch-all that blocks /health)
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);

      // Initialize Firebase Admin SDK for push notifications
      if (firebaseNotificationService.isInitialized()) {
        log("Firebase Admin SDK ready for push notifications");
      }

      // Delay background services to avoid connection burst on cold start
      setTimeout(async () => {
        // Seed borders if they don't exist (ensures production has all borders)
        try {
          const result = await seedBorders();
          if (result.inserted > 0) {
            log(`Seeded ${result.inserted} profile borders`);
          }
          
          // Reconcile borders for users who may have missed rewards
          const reconcileResult = await reconcileAllUsersWithStreaks();
          if (reconcileResult.totalStreakBorders > 0 || reconcileResult.totalReferralBorders > 0 || reconcileResult.totalSportsBorders > 0) {
            log(`Reconciled borders: ${reconcileResult.totalStreakBorders} streak, ${reconcileResult.totalReferralBorders} referral, ${reconcileResult.totalSportsBorders} sports`);
          }
        } catch (error) {
          console.error("Failed to seed/reconcile borders:", error);
        }

        // Seed memes if they don't exist (ensures production has all memes)
        try {
          const memesResult = await seedMemes();
          if (memesResult.inserted > 0) {
            log(`Seeded ${memesResult.inserted} memes`);
          }
        } catch (error) {
          console.error("Failed to seed memes:", error);
        }

        // Start the birthday service for automatic birthday messages
        startBirthdayService();

        // Start the mood boost scheduler for AI-powered uplifting posts
        startMoodBoostScheduler();

        // Start the referral bonus service to award referral bonuses
        startReferralBonusService();
        
        log("Background services started");
      }, 10000); // 10 second delay to let connections stabilize

      // Setup graceful shutdown for production
      const gracefulShutdown = (signal: string) => {
        log(`Received ${signal}, shutting down gracefully`);
        server.close(() => {
          log("HTTP server closed");
          const { pool } = require("./db");
          pool.end(() => {
            log("Database pool closed");
            process.exit(0);
          });
        });
      };

      process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
      process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    },
  );
})();
