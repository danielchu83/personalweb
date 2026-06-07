const http = require("http");
const https = require("https");

const MAX_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 10000;

function htmlMessage(title, body) {
  return `<!doctype html><html><body><h1>${title}</h1>${body ? `<p>${body}</p>` : ""}</body></html>`;
}

function response(status, body) {
  return {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
    body,
  };
}

function decodePrincipal(req) {
  const header = req?.headers?.["x-ms-client-principal"] || req?.headers?.["X-MS-CLIENT-PRINCIPAL"];
  if (!header) return null;

  try {
    return JSON.parse(Buffer.from(header, "base64").toString("utf8"));
  } catch (error) {
    return null;
  }
}

function allowedUsers() {
  return (process.env.GRIND_ALLOWED_GITHUB_USERS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedPrincipal(principal) {
  const provider = String(principal?.identityProvider || "").toLowerCase();
  const user = String(principal?.userDetails || "").toLowerCase();
  if (!provider || !user) return false;
  if (provider !== "github") return false;

  const allowed = allowedUsers();
  if (!allowed.length) return false;
  return allowed.includes(user) || allowed.includes(`github:${user}`);
}

function fetchText(target) {
  return new Promise((resolve, reject) => {
    const client = target.protocol === "https:" ? https : http;
    const request = client.get(
      target,
      {
        headers: {
          "User-Agent": "danielchu-dev-grind-proxy/1.0",
          Accept: "text/html",
        },
        timeout: TIMEOUT_MS,
      },
      (response) => {
        const chunks = [];
        let size = 0;

        response.on("data", (chunk) => {
          size += chunk.length;
          if (size > MAX_BYTES) {
            request.destroy(new Error("Grinder status response was too large."));
            return;
          }
          chunks.push(chunk);
        });

        response.on("end", () => {
          resolve({
            statusCode: response.statusCode || 502,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );

    request.on("timeout", () => {
      request.destroy(new Error("Grinder status request timed out."));
    });
    request.on("error", reject);
  });
}

module.exports = async function (context, req) {
  const targetValue = process.env.GRIND_STATUS_URL;
  const principal = decodePrincipal(req);

  if (!principal) {
    context.res = response(
      401,
      htmlMessage("Sign in required.", "Use GitHub authentication to access the grinder status."),
    );
    return;
  }

  if (!isAllowedPrincipal(principal)) {
    context.res = response(
      403,
      htmlMessage("Access denied.", "This GitHub account is not allowed to view the grinder status."),
    );
    return;
  }

  if (!targetValue) {
    context.res = response(503, htmlMessage("Grinder status is not configured."));
    return;
  }

  let target;
  try {
    target = new URL(targetValue);
  } catch (error) {
    context.res = response(503, htmlMessage("Grinder status configuration is invalid."));
    return;
  }

  if (target.protocol !== "https:" && target.protocol !== "http:") {
    context.res = response(503, htmlMessage("Grinder status configuration is invalid."));
    return;
  }

  try {
    const upstream = await fetchText(target);
    if (upstream.statusCode < 200 || upstream.statusCode >= 300) {
      context.res = response(502, htmlMessage("Grinder status upstream returned an error."));
      return;
    }

    context.res = response(200, upstream.body);
  } catch (error) {
    context.res = response(502, htmlMessage("Unable to reach grinder status."));
  }
};
