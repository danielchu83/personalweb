#!/usr/bin/env node

const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(__dirname, "..");

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function includes(source, phrase) {
  return source.includes(phrase);
}

function parseJson(file) {
  return JSON.parse(read(file));
}

async function withServer(statusCode, body, fn) {
  const server = http.createServer((req, res) => {
    res.writeHead(statusCode, { "Content-Type": "text/html; charset=utf-8" });
    res.end(body);
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  try {
    await fn(`http://127.0.0.1:${port}/private-status`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function callProxy(target) {
  const previous = process.env.GRIND_STATUS_URL;
  if (target === undefined) {
    delete process.env.GRIND_STATUS_URL;
  } else {
    process.env.GRIND_STATUS_URL = target;
  }

  try {
    const context = {};
    const proxy = require("../api/grind");
    await proxy(context, {});
    return context.res;
  } finally {
    if (previous === undefined) {
      delete process.env.GRIND_STATUS_URL;
    } else {
      process.env.GRIND_STATUS_URL = previous;
    }
  }
}

async function main() {
  const html = read("grind/index.html");
  const js = read("grind/grind.js");
  const api = read("api/grind/index.js");
  const functionJson = parseJson("api/grind/function.json");
  const hostJson = parseJson("api/host.json");
  const packageJson = parseJson("api/package.json");
  const sitePackage = parseJson("package.json");
  const config = parseJson("staticwebapp.config.json");
  const workflow = read(".github/workflows/azure-static-web-apps-kind-pond-00cfd070f.yml");
  const repoSource = [html, js, api, JSON.stringify(config), workflow].join("\n");

  const apiRoute = config.routes.find((route) => route.route === "/api/grind");
  const grindRoute = config.routes.find((route) => route.route === "/grind*");
  const trigger = functionJson.bindings.find((binding) => binding.type === "httpTrigger");

  const criteria = [
    ["route-01", "Grind page has a private status title", () => includes(html, "Atlas Grinder Status")],
    ["route-02", "Grind page points sign-in at GitHub auth", () => includes(html, "/.auth/login/github")],
    ["route-03", "Grind page keeps the passkey path explicit", () => includes(html, "Continue with passkey")],
    ["route-04", "Grind page is marked noindex", () => includes(html, 'name="robots" content="noindex, nofollow"')],
    ["route-05", "Grind client checks the auth session", () => includes(js, 'fetch("/.auth/me"')],
    ["route-06", "Grind client calls only the local API proxy", () => includes(js, 'fetch("/api/grind"')],
    ["route-07", "Grind client renders proxied HTML with srcdoc", () => includes(js, "frame.srcdoc")],
    ["route-08", "Grind client strips upstream meta refresh", () => includes(js, "stripRefresh") && includes(js, "http-equiv")],
    ["route-09", "Grind client auto-refreshes every minute", () => includes(js, "60000")],
    ["route-10", "Grind client offers sign out", () => includes(html, "/.auth/logout")],
    ["route-11", "Static config protects the API route", () => apiRoute && apiRoute.allowedRoles.includes("authenticated")],
    ["route-12", "Static config prevents indexing the private page", () => grindRoute && grindRoute.headers["X-Robots-Tag"] === "noindex, nofollow"],
    ["route-13", "Static config disables cache on private routes", () => apiRoute.headers["Cache-Control"] === "no-store" && grindRoute.headers["Cache-Control"] === "no-store"],
    ["route-14", "Deployment workflow ships the API folder", () => includes(workflow, 'api_location: "api"')],
    ["route-15", "Function trigger is anonymous because SWA handles auth", () => trigger && trigger.authLevel === "anonymous" && trigger.methods.includes("get")],
    ["route-16", "Function app uses Functions host version 2", () => hostJson.version === "2.0"],
    ["route-17", "Function package targets Node 20", () => packageJson.engines.node === "20.x"],
    ["route-18", "Proxy reads the target from Azure settings", () => includes(api, "process.env.GRIND_STATUS_URL")],
    ["route-19", "Proxy validates target protocol", () => includes(api, 'target.protocol !== "https:"') && includes(api, 'target.protocol !== "http:"')],
    ["route-20", "Proxy caps upstream response size", () => includes(api, "MAX_BYTES") && includes(api, "response was too large")],
    ["route-21", "Proxy sets no-store response headers", () => includes(api, '"Cache-Control": "no-store"')],
    ["route-22", "Proxy does not leak the private status host in repo files", () => !/20\.10\.44\.21|\/g\/Gy_|GRIND_STATUS_URL=https?:/.test(repoSource)],
    ["route-23", "Package test runs the grinder route eval", () => includes(sitePackage.scripts.test, "evaluate-grind-route.js")],
  ];

  let successfulProxyResponse;
  await withServer(200, "<!doctype html><html><body>grinder ok</body></html>", async (target) => {
    successfulProxyResponse = await callProxy(target);
  });
  criteria.push([
    "proxy-01",
    "Proxy returns successful upstream status HTML",
    () => successfulProxyResponse.status === 200 && includes(successfulProxyResponse.body, "grinder ok"),
  ]);

  criteria.push([
    "proxy-02",
    "Proxy fails closed when target is not configured",
    async () => {
      const response = await callProxy(undefined);
      return response.status === 503 && includes(response.body, "not configured");
    },
  ]);

  criteria.push([
    "proxy-03",
    "Proxy rejects non-HTTP targets",
    async () => {
      const response = await callProxy("file:///tmp/status.html");
      return response.status === 503 && includes(response.body, "invalid");
    },
  ]);

  let nonOkProxyResponse;
  await withServer(500, "broken", async (target) => {
    nonOkProxyResponse = await callProxy(target);
  });
  criteria.push([
    "proxy-04",
    "Proxy hides non-2xx upstream bodies",
    () => nonOkProxyResponse.status === 502 && !includes(nonOkProxyResponse.body, "broken"),
  ]);

  const results = [];
  for (const [id, description, check] of criteria) {
    let passed = false;
    let error = "";
    try {
      passed = Boolean(await check());
    } catch (err) {
      error = err.message;
    }
    results.push({ id, description, passed, error });
  }

  const failed = results.filter((result) => !result.passed);
  console.log(`Grind route auth/proxy evals: ${results.length - failed.length}/${results.length} passed`);

  if (failed.length) {
    for (const result of failed) {
      console.log(`FAIL ${result.id}: ${result.description}${result.error ? ` (${result.error})` : ""}`);
    }
    process.exit(1);
  }

  for (const result of results) {
    console.log(`PASS ${result.id}: ${result.description}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
