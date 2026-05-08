import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const defaultPort = Number(process.env.PORT || 4173);
const defaultHost = process.env.HOST || "127.0.0.1";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".ttf": "font/ttf",
};

function send(res, status, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "content-type": contentType,
    "cache-control": "no-store",
  });
  res.end(body);
}

function resolvePublicPath(url) {
  const { pathname } = new URL(url, "http://localhost");
  const relative = pathname === "/" ? "index.html" : pathname.slice(1);
  const normalized = normalize(relative).replace(/^(\.\.[/\\])+/, "");
  return join(root, normalized);
}

export function startServer({ host = defaultHost, port = defaultPort } = {}) {
  const server = createServer(async (req, res) => {
    try {
      const target = resolvePublicPath(req.url || "/");
      const body = await readFile(target);
      send(res, 200, body, types[extname(target)] || "application/octet-stream");
    } catch {
      send(res, 404, "Not found");
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      const address = server.address();
      const actualPort = typeof address === "object" && address ? address.port : port;
      resolve({ server, url: `http://${host}:${actualPort}/` });
    });
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { url } = await startServer();
  console.log(`Agent Desk Skeleton listening on ${url}`);
}
