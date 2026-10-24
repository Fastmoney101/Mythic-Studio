import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const assets = new Map([
  ["/", { file: new URL("../index.html", import.meta.url), type: "text/html; charset=utf-8" }],
  ["/index.html", { file: new URL("../index.html", import.meta.url), type: "text/html; charset=utf-8" }],
  ["/styles.css", { file: new URL("../styles.css", import.meta.url), type: "text/css; charset=utf-8" }],
  ["/src/main.js", { file: new URL("./main.js", import.meta.url), type: "text/javascript; charset=utf-8" }],
  ["/src/simulator.js", { file: new URL("./simulator.js", import.meta.url), type: "text/javascript; charset=utf-8" }],
]);

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  let pathname;
  try {
    pathname = new URL(request.url, "http://localhost").pathname;
  } catch (error) {
    response.writeHead(400).end("Invalid request URL");
    return;
  }
  const asset = assets.get(pathname);
  if (!asset) {
    response.writeHead(404).end("Not found");
    return;
  }
  try {
    const body = await readFile(asset.file);
    response.writeHead(200, { "Content-Type": asset.type, "Cache-Control": "no-store" });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch (error) {
    console.error(`Unable to serve ${pathname}:`, error);
    response.writeHead(500).end("Unable to serve requested file");
  }
});

server.on("error", (error) => {
  console.error("Simulator server failed:", error);
  process.exitCode = 1;
});

server.listen(4173, "127.0.0.1", () => {
  console.log("Mythic Studio simulator running at http://127.0.0.1:4173");
});
