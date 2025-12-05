import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS for frontend served from mykliq.app / kliqlife.com
app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;

  const allowedOrigins = [
    "https://mykliq.app",
    "https://www.mykliq.app",
    "https://kliqlife.com",
    "https://www.kliqlife.com",
    "https://main.d1dc1ug0nbi5ry.amplifyapp.com",
  ];

  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  }

  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  res.header(
    "Access-Control-Allow-Headers",
    req.headers["access-control-request-headers"] ||
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// Serve static assets from your built frontend
app.use(express.static(path.join(__dirname, "client/dist/public")));

// Fallback route — serve index.html for any client-side routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/dist/public/index.html"));
});

// Start your backend logic if needed
// Example: import your API or AI routes
// import { handler } from "./dist/index.js";

app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");  
});
