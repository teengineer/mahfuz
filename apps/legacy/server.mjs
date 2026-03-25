import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PORT = parseInt(process.env.PORT || "3000", 10);

// MIME types for static files
const MIME_TYPES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".webmanifest": "application/manifest+json",
};

// Try to serve a static file, returns true if served
async function tryServeStatic(req, res, basePath) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const filePath = join(basePath, decodeURIComponent(url.pathname));

  // Security: prevent directory traversal
  if (!filePath.startsWith(basePath)) return false;

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) return false;

    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const data = await readFile(filePath);

    // Cache static assets aggressively (hashed filenames)
    const cacheControl =
      url.pathname.startsWith("/assets/")
        ? "public, max-age=31536000, immutable"
        : "public, max-age=3600";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": data.length,
      "Cache-Control": cacheControl,
    });
    res.end(data);
    return true;
  } catch {
    return false;
  }
}

// Convert Node.js IncomingMessage to Web Request
function toWebRequest(req) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      if (Array.isArray(value)) {
        for (const v of value) headers.append(key, v);
      } else {
        headers.set(key, value);
      }
    }
  }

  const init = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req;
    init.duplex = "half";
  }

  return new Request(url.href, init);
}

// Send Web Response back through Node.js
async function sendWebResponse(res, webResponse) {
  const headers = {};
  webResponse.headers.forEach((value, key) => {
    if (headers[key]) {
      headers[key] = Array.isArray(headers[key])
        ? [...headers[key], value]
        : [headers[key], value];
    } else {
      headers[key] = value;
    }
  });

  res.writeHead(webResponse.status, headers);

  if (webResponse.body) {
    const reader = webResponse.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    } finally {
      reader.releaseLock();
    }
  }
  res.end();
}

// Legacy redirects (migrated from Netlify config)
const REDIRECTS = [
  { from: /^\/surah\/(\d+)\/?$/, to: "/$1", status: 301 },
  { from: /^\/surah\/?$/, to: "/browse", status: 301 },
  { from: /^\/verse\/?$/, to: "/browse", status: 301 },
];

function tryRedirect(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  for (const rule of REDIRECTS) {
    const match = url.pathname.match(rule.from);
    if (match) {
      const target = rule.to.replace(/\$(\d+)/g, (_, i) => match[i] || "");
      res.writeHead(rule.status, { Location: target + url.search });
      res.end();
      return true;
    }
  }
  return false;
}

async function main() {
  // Run Drizzle migrations on startup
  try {
    const { drizzle } = await import("drizzle-orm/libsql");
    const { migrate } = await import("drizzle-orm/libsql/migrator");
    const { createClient } = await import("@libsql/client");

    const dbUrl = process.env.TURSO_DATABASE_URL;
    if (dbUrl) {
      const client = createClient({
        url: dbUrl,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      const db = drizzle(client);
      await migrate(db, { migrationsFolder: join(__dirname, "drizzle") });
      console.log("[mahfuz] Drizzle migrations applied");
    } else {
      console.log("[mahfuz] No TURSO_DATABASE_URL, skipping migrations");
    }
  } catch (err) {
    console.error("[mahfuz] Migration error (non-fatal):", err.message);
  }

  // Import TanStack Start SSR handler
  const serverEntry = await import("./dist/server/server.js");
  const handler = serverEntry.default?.fetch ?? serverEntry.default;

  if (typeof handler !== "function") {
    console.error(
      "[mahfuz] Could not find fetch handler in dist/server/server.js"
    );
    process.exit(1);
  }

  const clientDir = join(__dirname, "dist", "client");

  const server = createServer(async (req, res) => {
    try {
      // 1. Legacy redirects
      if (tryRedirect(req, res)) return;

      // 2. Try static files from dist/client/ (built assets + public/)
      if (await tryServeStatic(req, res, clientDir)) return;

      // 3. Forward to TanStack Start SSR handler
      const webRequest = toWebRequest(req);
      const webResponse = await handler(webRequest);
      await sendWebResponse(res, webResponse);
    } catch (err) {
      console.error("[mahfuz] Request error:", err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      }
    }
  });

  server.listen(PORT, () => {
    console.log(`[mahfuz] Server running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("[mahfuz] Fatal:", err);
  process.exit(1);
});
