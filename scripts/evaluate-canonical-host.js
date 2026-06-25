#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const configSource = fs.readFileSync(path.join(root, "scripts/config.js"), "utf8");

function runConfigAt(url) {
  const redirects = [];
  const locationUrl = new URL(url);
  const location = {
    get href() {
      return locationUrl.href;
    },
    get hostname() {
      return locationUrl.hostname;
    },
    replace(target) {
      redirects.push(target);
    },
  };
  const context = vm.createContext({ URL, Set, window: { location } });
  vm.runInContext(configSource, context, { filename: "scripts/config.js" });
  return { config: context.window.personalWeb, redirects };
}

const cases = [
  {
    name: "default Static Web Apps host redirects to canonical apex",
    url: "https://calm-plant-09f98420f.7.azurestaticapps.net/articles/example.html?from=old#note",
    expected: ["https://danielchu.dev/articles/example.html?from=old#note"],
  },
  {
    name: "custom apex is left alone",
    url: "https://danielchu.dev/",
    expected: [],
  },
  {
    name: "www custom host is left alone",
    url: "https://www.danielchu.dev/",
    expected: [],
  },
  {
    name: "local preview is left alone",
    url: "http://127.0.0.1:4173/",
    expected: [],
  },
];

const failures = [];

for (const testCase of cases) {
  const { config, redirects } = runConfigAt(testCase.url);
  if (config?.canonicalHost?.primary !== "danielchu.dev") {
    failures.push(`${testCase.name}: missing canonical host config`);
    continue;
  }
  if (JSON.stringify(redirects) !== JSON.stringify(testCase.expected)) {
    failures.push(
      `${testCase.name}: expected ${JSON.stringify(testCase.expected)}, got ${JSON.stringify(redirects)}`,
    );
  }
}

if (failures.length) {
  console.log(`Canonical host checks failed: ${failures.length}`);
  for (const failure of failures) console.log(`FAIL ${failure}`);
  process.exit(1);
}

console.log(`Canonical host checks passed: ${cases.length}/${cases.length}`);
