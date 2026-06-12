#!/usr/bin/env node

const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(__dirname, "..");
const ignoredDirs = new Set([".git", "node_modules", "dist"]);
const skippedPaths = new Set(["/.auth/login/github", "/.auth/logout", "/api/grind", "/login", "/logout"]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        walk(path.join(dir, entry.name), files);
      }
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".svg")) return "image/svg+xml";
  if (file.endsWith(".ico")) return "image/x-icon";
  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".json")) return "application/json; charset=utf-8";
  return "application/octet-stream";
}

function fileForRequest(urlPath) {
  let pathname;
  try {
    pathname = decodeURIComponent(urlPath);
  } catch (error) {
    return null;
  }
  if (pathname === "/") return path.join(root, "index.html");
  const relative = pathname.replace(/^\/+/, "");
  const candidate = pathname.endsWith("/")
    ? path.join(root, relative, "index.html")
    : path.join(root, relative);
  const resolved = path.resolve(candidate);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) return null;
  return resolved;
}

function routeForHtml(file) {
  const relative = path.relative(root, file).split(path.sep).join("/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) return `/${relative.replace(/index\.html$/, "")}`;
  return `/${relative}`;
}

function extractReferences(html) {
  const references = [];
  const attributePattern = /\b(?:href|src)=["']([^"']+)["']/gi;
  for (const match of html.matchAll(attributePattern)) {
    references.push(match[1]);
  }
  return references;
}

function extractIds(html) {
  const ids = new Set();
  const idPattern = /\b(?:id|name)=["']([^"']+)["']/gi;
  for (const match of html.matchAll(idPattern)) {
    ids.add(match[1]);
  }
  return ids;
}

function shouldSkipReference(value, target) {
  if (!value || value.startsWith("#")) return false;
  if (/^(?:https?:)?\/\//i.test(value)) return true;
  if (/^(?:mailto|tel|data):/i.test(value)) return true;
  return skippedPaths.has(target.pathname);
}

function startServer() {
  const server = http.createServer((req, res) => {
    const requestUrl = new URL(req.url, "http://127.0.0.1");
    const file = fileForRequest(requestUrl.pathname);
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("not found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentType(file) });
    res.end(fs.readFileSync(file));
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function fetchOk(url) {
  const response = await fetch(url);
  const text = await response.text();
  return { ok: response.ok, status: response.status, text, contentType: response.headers.get("content-type") || "" };
}

async function main() {
  const htmlFiles = walk(root).sort();
  const routes = htmlFiles.map(routeForHtml);
  const server = await startServer();
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;
  const failures = [];
  let referenceCount = 0;

  try {
    const pageBodies = new Map();
    for (const route of routes) {
      const result = await fetchOk(`${base}${route}`);
      if (!result.ok) {
        failures.push(`${route} returned ${result.status}`);
        continue;
      }
      if (!result.contentType.includes("text/html") || !result.text.includes("<html")) {
        failures.push(`${route} did not return a nonblank HTML page`);
      }
      pageBodies.set(route, result.text);
    }

    const checked = new Set();
    for (const [route, html] of pageBodies) {
      const currentIds = extractIds(html);
      for (const reference of extractReferences(html)) {
        const target = new URL(reference, `${base}${route}`);
        if (shouldSkipReference(reference, target)) continue;

        if (target.origin !== base) continue;
        const targetPath = target.pathname;
        const targetKey = `${targetPath}${target.search}`;
        if (!checked.has(targetKey)) {
          checked.add(targetKey);
          referenceCount += 1;
          const result = await fetchOk(`${base}${targetPath}${target.search}`);
          if (!result.ok) {
            failures.push(`${route} references missing local resource ${targetPath} (${result.status})`);
          }
        }

        if (target.hash) {
          const normalizedPage = targetPath === route ? route : routeForHtml(fileForRequest(targetPath) || "");
          const targetHtml = targetPath === route ? html : pageBodies.get(normalizedPage);
          const targetIds = targetHtml ? extractIds(targetHtml) : currentIds;
          const id = decodeURIComponent(target.hash.slice(1));
          if (targetHtml && !targetIds.has(id)) {
            failures.push(`${route} references missing anchor ${targetPath}${target.hash}`);
          }
        }
      }
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  if (failures.length) {
    console.log(`Page checks failed: ${failures.length}`);
    for (const failure of failures) console.log(`FAIL ${failure}`);
    process.exit(1);
  }

  console.log(`Page checks passed: ${routes.length} pages, ${referenceCount} local references`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
