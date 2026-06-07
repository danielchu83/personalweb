const http = require("http");
const https = require("https");

const MAX_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 10000;

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

module.exports = async function (context) {
  const targetValue = process.env.GRIND_STATUS_URL;
  const baseHeaders = {
    "Cache-Control": "no-store",
    "Content-Type": "text/html; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow",
  };

  if (!targetValue) {
    context.res = {
      status: 503,
      headers: baseHeaders,
      body: "<!doctype html><html><body><h1>Grinder status is not configured.</h1></body></html>",
    };
    return;
  }

  let target;
  try {
    target = new URL(targetValue);
  } catch (error) {
    context.res = {
      status: 503,
      headers: baseHeaders,
      body: "<!doctype html><html><body><h1>Grinder status configuration is invalid.</h1></body></html>",
    };
    return;
  }

  if (target.protocol !== "https:" && target.protocol !== "http:") {
    context.res = {
      status: 503,
      headers: baseHeaders,
      body: "<!doctype html><html><body><h1>Grinder status configuration is invalid.</h1></body></html>",
    };
    return;
  }

  try {
    const upstream = await fetchText(target);
    if (upstream.statusCode < 200 || upstream.statusCode >= 300) {
      context.res = {
        status: 502,
        headers: baseHeaders,
        body: "<!doctype html><html><body><h1>Grinder status upstream returned an error.</h1></body></html>",
      };
      return;
    }

    context.res = {
      status: 200,
      headers: baseHeaders,
      body: upstream.body,
    };
  } catch (error) {
    context.res = {
      status: 502,
      headers: baseHeaders,
      body: "<!doctype html><html><body><h1>Unable to reach grinder status.</h1></body></html>",
    };
  }
};
