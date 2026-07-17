import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import crypto from 'crypto';

const app = express();
const PORT = 3000;

app.use(express.json());

// TVMaze endpoints (No auth needed, but proxied for consistency and CORS)
app.get("/api/search/tv", async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ error: "Query is required" });
    const response = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(q)}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch from TVMaze" });
  }
});

app.get("/api/details/tv", async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ error: "Query is required" });
    const response = await fetch(`https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(q)}&embed[]=cast&embed[]=episodes`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch details from TVMaze" });
  }
});

// TMDB endpoints
app.get("/api/search/movie", async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ error: "Query is required" });
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "TMDB API Key is not configured." });
    }
    const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(q)}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch from TMDB" });
  }
});


async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
