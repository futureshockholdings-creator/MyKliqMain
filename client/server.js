import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.static(path.join(__dirname, "dist/public")));
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist/public/index.html"));
});

app.listen(3000, () => console.log("Server running on port 3000"));
