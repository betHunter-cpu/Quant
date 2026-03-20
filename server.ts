import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

// Simple in-memory cache
interface CacheItem {
  data: Buffer;
  contentType: string;
  expiry: number;
}
const apiCache = new Map<string, CacheItem>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS middleware to allow requests if needed
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  // Proxy all /api requests to the real external API
  app.use("/api", async (req, res) => {
    const apiUrl = process.env.EXTERNAL_API_URL;
    const apiKey = process.env.EXTERNAL_API_KEY;

    if (!apiUrl || !apiKey) {
      return res.status(400).json({
        error: "MISSING_SECRETS",
        message: "Faltan las variables EXTERNAL_API_URL y EXTERNAL_API_KEY en los Secrets."
      });
    }

    const cacheKey = req.originalUrl;

    // 1. Check if we have a valid cached response
    if (apiCache.has(cacheKey)) {
      const cached = apiCache.get(cacheKey)!;
      if (Date.now() < cached.expiry) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        res.set('Content-Type', cached.contentType);
        return res.status(200).send(cached.data);
      } else {
        console.log(`[CACHE EXPIRED] ${cacheKey}`);
        apiCache.delete(cacheKey);
      }
    }

    try {
      console.log(`[API REQUEST] Fetching from external API: ${cacheKey}`);
      // Forward the exact path requested by the React app
      const targetUrl = `${apiUrl.replace(/\/$/, '')}${req.originalUrl}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'x-rapidapi-key': apiKey // Common header for sports APIs
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorDetails = "";
        try {
          errorDetails = await response.text();
        } catch (e) {}
        return res.status(response.status).json({ 
          error: "API_ERROR", 
          message: `La API externa respondió con status: ${response.status}`,
          details: errorDetails
        });
      }

      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 2. Save successful response to cache
      // Determine Time-To-Live (TTL) based on the endpoint
      let ttlHours = 24; // Default: 24 hours for stats, logos
      if (cacheKey.includes('/odds') || cacheKey.includes('/matches/')) {
        ttlHours = 1; // 1 hour for odds and matches
      }
      
      apiCache.set(cacheKey, {
        data: buffer,
        contentType: contentType,
        expiry: Date.now() + (ttlHours * 60 * 60 * 1000)
      });

      // 3. Send response to client
      res.set('Content-Type', contentType);
      res.status(response.status).send(buffer);
      
    } catch (error: any) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "PROXY_ERROR", message: error.message });
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
