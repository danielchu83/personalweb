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

async function withServer(statusCode, body, fn, options = {}) {
  const server = http.createServer((req, res) => {
    if (options.requireSecret && req.headers["x-grind-status-secret"] !== "test-secret") {
      res.writeHead(403, { "Content-Type": "text/html; charset=utf-8" });
      res.end("missing proxy secret");
      return;
    }
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

function principalHeader(userDetails = "grind-owner", identityProvider = "github") {
  return Buffer.from(
    JSON.stringify({
      identityProvider,
      userDetails,
      userRoles: ["anonymous", "authenticated"],
    }),
  ).toString("base64");
}

async function callProxy(target, options = {}) {
  const previous = process.env.GRIND_STATUS_URL;
  const previousAllowed = process.env.GRIND_ALLOWED_GITHUB_USERS;
  const previousProxySecret = process.env.GRIND_STATUS_PROXY_SECRET;
  if (target === undefined) {
    delete process.env.GRIND_STATUS_URL;
  } else {
    process.env.GRIND_STATUS_URL = target;
  }
  process.env.GRIND_ALLOWED_GITHUB_USERS = options.allowedUsers || "grind-owner";
  if (options.proxySecret === null) {
    delete process.env.GRIND_STATUS_PROXY_SECRET;
  } else {
    process.env.GRIND_STATUS_PROXY_SECRET = options.proxySecret || "test-secret";
  }

  try {
    const context = {};
    const proxy = require("../api/grind");
    const headers = {};
    if (options.principal !== false) {
      headers["x-ms-client-principal"] = principalHeader(options.userDetails, options.identityProvider);
    }
    await proxy(context, { headers });
    return context.res;
  } finally {
    if (previous === undefined) {
      delete process.env.GRIND_STATUS_URL;
    } else {
      process.env.GRIND_STATUS_URL = previous;
    }
    if (previousAllowed === undefined) {
      delete process.env.GRIND_ALLOWED_GITHUB_USERS;
    } else {
      process.env.GRIND_ALLOWED_GITHUB_USERS = previousAllowed;
    }
    if (previousProxySecret === undefined) {
      delete process.env.GRIND_STATUS_PROXY_SECRET;
    } else {
      process.env.GRIND_STATUS_PROXY_SECRET = previousProxySecret;
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
    ["route-11", "Static config requires GitHub authentication for the API route", () => apiRoute && apiRoute.allowedRoles.length === 1 && apiRoute.allowedRoles.includes("authenticated")],
    ["route-12", "Static config prevents indexing the private page", () => grindRoute && grindRoute.headers["X-Robots-Tag"] === "noindex, nofollow"],
    ["route-13", "Static config disables cache on private routes", () => apiRoute.headers["Cache-Control"] === "no-store" && grindRoute.headers["Cache-Control"] === "no-store"],
    ["route-14", "Deployment workflow ships the managed API folder", () => includes(workflow, 'api_location: "api"')],
    ["route-15", "Function trigger is anonymous because SWA handles auth", () => trigger && trigger.authLevel === "anonymous" && trigger.methods.includes("get")],
    ["route-16", "Function app uses Functions host version 2", () => hostJson.version === "2.0"],
    ["route-17", "Function package targets Node 20", () => packageJson.engines.node === "20.x"],
    ["route-18", "Proxy reads the target from Azure settings", () => includes(api, "process.env.GRIND_STATUS_URL")],
    ["route-19", "Proxy reads allowed GitHub users from Azure settings", () => includes(api, "process.env.GRIND_ALLOWED_GITHUB_USERS")],
    ["route-20", "Proxy reads the VM shared secret from Azure settings", () => includes(api, "process.env.GRIND_STATUS_PROXY_SECRET")],
    ["route-21", "Proxy sends the shared secret as a backend-only header", () => includes(api, '"X-Grind-Status-Secret": proxySecret')],
    ["route-22", "Proxy checks the Static Web Apps client principal", () => includes(api, "x-ms-client-principal") && includes(api, "identityProvider")],
    ["route-23", "Proxy validates target protocol", () => includes(api, 'target.protocol !== "https:"') && includes(api, 'target.protocol !== "http:"')],
    ["route-24", "Proxy caps upstream response size", () => includes(api, "MAX_BYTES") && includes(api, "response was too large")],
    ["route-25", "Proxy sets no-store response headers", () => includes(api, '"Cache-Control": "no-store"')],
    ["route-26", "Client shows a distinct denied state", () => includes(js, "setDenied") && includes(js, "Signed in, but this account is not allowed")],
    ["route-27", "Proxy does not leak the private status host in repo files", () => !/20\.10\.44\.21|\/g\/Gy_|GRIND_STATUS_URL=https?:/.test(repoSource)],
    ["route-28", "Package test runs the grinder route eval", () => includes(sitePackage.scripts.test, "evaluate-grind-route.js")],
    ["route-29", "Static config pins the managed API runtime to Node 20", () => config.platform && config.platform.apiRuntime === "node:20"],
    ["route-30", "Deployment workflow skips rebuilding the prebuilt API package", () => includes(workflow, "skip_api_build: true")],
    ["route-31", "Deployment workflow uses a relative static app root", () => includes(workflow, 'app_location: "."')],
    ["route-32", "Static config allows the Front Door www host", () => config.forwardingGateway && config.forwardingGateway.allowedForwardedHosts.includes("www.danielchu.dev")],
  ];

  let successfulProxyResponse;
  await withServer(200, "<!doctype html><html><body>grinder ok</body></html>", async (target) => {
    successfulProxyResponse = await callProxy(target);
  }, { requireSecret: true });
  criteria.push([
    "proxy-01",
    "Proxy returns successful upstream status HTML",
    () => successfulProxyResponse.status === 200 && includes(successfulProxyResponse.body, "grinder ok"),
  ]);

  criteria.push([
    "proxy-02",
    "Proxy rejects missing client principals",
    async () => {
      const response = await callProxy("http://127.0.0.1/private-status", { principal: false });
      return response.status === 401 && includes(response.body, "Sign in required");
    },
  ]);

  criteria.push([
    "proxy-03",
    "Proxy rejects GitHub users outside the allowlist",
    async () => {
      const response = await callProxy("http://127.0.0.1/private-status", { userDetails: "someone-else" });
      return response.status === 403 && includes(response.body, "Access denied");
    },
  ]);

  criteria.push([
    "proxy-04",
    "Proxy fails closed when backend secret is not configured",
    async () => {
      const response = await callProxy("http://127.0.0.1/private-status", { proxySecret: null });
      return response.status === 503 && includes(response.body, "proxy is not configured");
    },
  ]);

  criteria.push([
    "proxy-05",
    "Proxy fails closed when target is not configured",
    async () => {
      const response = await callProxy(undefined);
      return response.status === 503 && includes(response.body, "not configured");
    },
  ]);

  criteria.push([
    "proxy-06",
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
    "proxy-07",
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
