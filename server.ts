import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // YouTube API Proxy
  app.get("/api/youtube/:endpoint", async (req, res) => {
    const { endpoint } = req.params;
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

    if (!YOUTUBE_API_KEY) {
      return res.status(500).json({ error: "YouTube API Key is missing on the server." });
    }

    const queryParams = new URLSearchParams(req.query as any);
    queryParams.set("key", YOUTUBE_API_KEY);

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/${endpoint}?${queryParams.toString()}`
      );
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("YouTube Proxy Error:", error);
      res.status(500).json({ error: "Failed to fetch from YouTube API" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
