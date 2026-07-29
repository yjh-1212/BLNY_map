import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const APP_DIR = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(APP_DIR, "public");
const PORT = Number.parseInt(process.env.PORT || "8080", 10);
const HOST = process.env.HOST || "0.0.0.0";

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

const securityHeaders = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https://tile.openstreetmap.org; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'",
  "Referrer-Policy": "same-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
};

function writeJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    ...securityHeaders,
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function resolvePublicPath(pathname) {
  const relativePath =
    pathname === "/" || pathname === "/index.html"
      ? "dashboard.html"
      : decodeURIComponent(pathname).replace(/^\/+/, "");
  const absolutePath = resolve(PUBLIC_DIR, relativePath);

  if (
    absolutePath !== PUBLIC_DIR &&
    !absolutePath.startsWith(`${PUBLIC_DIR}${sep}`)
  ) {
    return null;
  }

  return absolutePath;
}

const server = createServer(async (request, response) => {
  const method = request.method || "GET";
  const requestUrl = new URL(request.url || "/", "http://localhost");

  if (requestUrl.pathname === "/api/health") {
    if (method !== "GET" && method !== "HEAD") {
      response.writeHead(405, {
        ...securityHeaders,
        Allow: "GET, HEAD",
      });
      response.end();
      return;
    }

    writeJson(response, 200, {
      status: "ok",
      service: "beiliang-nanyun-map",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (method !== "GET" && method !== "HEAD") {
    response.writeHead(405, {
      ...securityHeaders,
      Allow: "GET, HEAD",
    });
    response.end();
    return;
  }

  let publicPath;
  try {
    publicPath = resolvePublicPath(requestUrl.pathname);
  } catch {
    writeJson(response, 400, { error: "Invalid request path" });
    return;
  }

  if (!publicPath) {
    writeJson(response, 403, { error: "Forbidden" });
    return;
  }

  try {
    const fileInfo = await stat(publicPath);
    if (!fileInfo.isFile()) {
      writeJson(response, 404, { error: "Not found" });
      return;
    }

    const extension = extname(publicPath).toLowerCase();
    const isHtml = extension === ".html";
    response.writeHead(200, {
      ...securityHeaders,
      "Cache-Control": isHtml
        ? "no-cache"
        : "public, max-age=604800, immutable",
      "Content-Length": fileInfo.size,
      "Content-Type":
        contentTypes.get(extension) || "application/octet-stream",
    });

    if (method === "HEAD") {
      response.end();
      return;
    }

    const stream = createReadStream(publicPath);
    stream.on("error", () => {
      if (!response.headersSent) {
        writeJson(response, 500, { error: "Unable to read file" });
      } else {
        response.destroy();
      }
    });
    stream.pipe(response);
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      writeJson(response, 404, { error: "Not found" });
      return;
    }
    writeJson(response, 500, { error: "Internal server error" });
  }
});

server.listen(PORT, HOST, () => {
  const displayHost = HOST === "0.0.0.0" || HOST === "::" ? "localhost" : HOST;
  console.log(`北粮南运路径图服务已启动：http://${displayHost}:${PORT}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
