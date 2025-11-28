import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { startBirthdayService } from "./birthdayService";
import { startMoodBoostScheduler } from "./services/moodBoostScheduler";
import { startReferralBonusService } from "./referralBonusService";
import { setupVite, serveStatic, log } from "./vite";
import { performanceOptimizer } from "./performanceOptimizer";
import { rateLimitService } from "./rateLimitService";
import { firebaseNotificationService } from "./firebase-notifications";

const app = express();

// CORS configuration for mobile and cross-origin requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "https://mykliq.app",
    "https://www.mykliq.app",
    "https://kliqlife.com",
    "https://www.kliqlife.com",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "http://0.0.0.0:5000",
    "http://172.31.65.34:5000",
    "https://main.d1dc1ug0nbi5ry.amplifyapp.com",
    process.env.AMPLIFY_APP_URL || null,
    process.env.REPL_SLUG
      ? `https://${process.env.REPL_SLUG}.${process.env.REPLIT_DEV_DOMAIN}`
      : null,
  ].filter(Boolean);

  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else if (!origin) {
    // Allow same-origin requests (no origin header)
    res.header("Access-Control-Allow-Origin", "*");
  }

  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie",
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Max-Age", "86400"); // 24 hours

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

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
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

      // Detect serverless environment (AWS Lambda/Amplify)
      const isServerless = !!(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AMPLIFY_APP_ID);

      // Start background services only in non-serverless environments
      // In serverless, these should be triggered via scheduled Lambda/CloudWatch Events
      if (!isServerless) {
        // Start the birthday service for automatic birthday messages
        startBirthdayService();

        // Start the mood boost scheduler for AI-powered uplifting posts
        startMoodBoostScheduler();

        // Start the referral bonus service to award referral bonuses
        startReferralBonusService();
      } else {
        log("Running in serverless mode - scheduled tasks disabled");
        log("Use CloudWatch Events or Lambda triggers for background tasks");
      }

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
