
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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