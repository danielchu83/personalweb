#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

const files = {
  home: read("index.html"),
  portfolio: read("portfolio.html"),
  atlas: read("projects/atlas.html"),
  about: read("about.html"),
  article: read("articles/when-agent-tool-use-isnt-evidence.html"),
  styles: read("styles.css"),
  workflow: read(".github/workflows/azure-static-web-apps-kind-pond-00cfd070f.yml"),
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, value]) => [
    key,
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  ]),
);

const candidatePages = `${text.home} ${text.portfolio} ${text.atlas}`;
const allPublicText = `${candidatePages} ${text.about} ${text.article}`;

function includes(source, phrase) {
  return source.toLowerCase().includes(phrase.toLowerCase());
}

function count(source, pattern) {
  const match = source.match(new RegExp(pattern, "gi"));
  return match ? match.length : 0;
}

function hasAll(source, phrases) {
  return phrases.every((phrase) => includes(source, phrase));
}

function no(source, phrase) {
  return !includes(source, phrase);
}

const criteria = [
  ["home-01", "Homepage positions Daniel as AI-native", () => includes(text.home, "AI-native builder")],
  ["home-02", "Homepage hero leads with agent systems", () => includes(text.home, "I build agent systems that survive real work.")],
  ["home-03", "Homepage mentions hands-on building", () => includes(text.home, "build the systems myself")],
  ["home-04", "Homepage mentions Copilot Mobile", () => includes(text.home, "Copilot Mobile")],
  ["home-05", "Homepage mentions multi-agent development loops", () => includes(text.home, "multi-agent development loops")],
  ["home-06", "Homepage mentions eval gates", () => includes(text.home, "eval gates")],
  ["home-07", "Homepage mentions workflow replay", () => includes(text.home, "workflow replay")],
  ["home-08", "Homepage mentions recovery paths", () => includes(text.home, "recovery paths")],
  ["home-09", "Homepage mentions production use", () => includes(text.home, "production")],
  ["home-10", "Homepage explains real-world agent failure surface", () => hasAll(text.home, ["files", "tools", "memory", "side effects"])],
  ["home-11", "Homepage includes shipped proof label", () => includes(text.home, "Shipped")],
  ["home-12", "Homepage includes production multi-agent proof", () => includes(text.home, "Production multi-agent development system")],
  ["home-13", "Homepage includes hands-on workflow proof", () => includes(text.home, "Hands-on agent workflows")],
  ["home-14", "Homepage includes Atlas proof", () => includes(text.home, "Atlas experiments")],
  ["home-15", "Homepage current projects are builder evidence", () => includes(text.home, "Builder evidence")],
  ["home-16", "Homepage says systems, not slideware", () => includes(text.home, "Systems, not slideware.")],
  ["home-17", "Homepage primary CTA goes to work", () => /<div class="lab-actions">\s*<a href="portfolio\.html">See selected work<\/a>/m.test(files.home)],
  ["home-18", "Homepage does not lead with corporate title", () => no(text.home, "Partner Group Product Manager")],
  ["home-19", "Homepage avoids resume framing above the fold", () => no(text.home, "resume")],
  ["home-20", "Homepage contact speaks to frontier AI systems", () => includes(text.home, "frontier AI systems")],
  ["home-21", "Homepage contact asks for product judgment", () => includes(text.home, "product judgment")],
  ["home-22", "Homepage contact asks for hands-on builders", () => includes(text.home, "hands-on builders")],
  ["home-23", "Homepage meta says AI-native product builder", () => includes(files.home, "AI-native product builder")],
  ["home-24", "Homepage meta mentions workflow replay", () => includes(files.home, "workflow replay")],
  ["home-25", "Homepage meta mentions real AI work", () => includes(files.home, "real AI work")],

  ["portfolio-01", "Portfolio title leads with shipped AI systems", () => includes(text.portfolio, "Public edges of AI systems that shipped.")],
  ["portfolio-02", "Portfolio describes frontier AI ideas becoming product surfaces", () => includes(text.portfolio, "frontier AI ideas become product surfaces")],
  ["portfolio-03", "Portfolio mentions agentic workflows", () => includes(text.portfolio, "agentic workflows")],
  ["portfolio-04", "Portfolio mentions eval gates", () => includes(text.portfolio, "eval gates")],
  ["portfolio-05", "Portfolio mentions review paths", () => includes(text.portfolio, "review paths")],
  ["portfolio-06", "Portfolio mentions recovery systems", () => includes(text.portfolio, "recovery systems")],
  ["portfolio-07", "Portfolio includes production proof", () => includes(text.portfolio, "Production")],
  ["portfolio-08", "Portfolio includes PM and Design usage", () => includes(text.portfolio, "used by PM and Design")],
  ["portfolio-09", "Portfolio includes hands-on proof", () => includes(text.portfolio, "Hands-on")],
  ["portfolio-10", "Portfolio says Daniel builds loops/evals/repair paths himself", () => includes(text.portfolio, "I build the agent loops, evals, and repair paths myself")],
  ["portfolio-11", "Portfolio includes research taste proof", () => includes(text.portfolio, "Research taste")],
  ["portfolio-12", "Portfolio explains Atlas failure-to-product-question value", () => includes(text.portfolio, "Atlas turns agent failures into testable product questions")],
  ["portfolio-13", "Portfolio CTA says See systems", () => includes(text.portfolio, "See systems")],
  ["portfolio-14", "Portfolio keeps contact reachable", () => includes(files.portfolio, 'href="index.html#contact"') && includes(text.portfolio, "Contact")],
  ["portfolio-15", "Portfolio says original builder", () => includes(text.portfolio, "Original builder")],
  ["portfolio-16", "Portfolio says active developer", () => includes(text.portfolio, "active developer")],
  ["portfolio-17", "Portfolio says product owner for workflow", () => includes(text.portfolio, "product owner for the workflow")],
  ["portfolio-18", "Portfolio mentions source-of-truth checks", () => includes(text.portfolio, "source-of-truth checks")],
  ["portfolio-19", "Portfolio labels Atlas as eval lab", () => includes(text.portfolio, "Private AI workflow and eval lab")],
  ["portfolio-20", "Portfolio mentions scheduled jobs", () => includes(text.portfolio, "scheduled jobs")],
  ["portfolio-21", "Portfolio mentions sensitive data boundaries", () => includes(text.portfolio, "sensitive data boundaries")],
  ["portfolio-22", "Portfolio mentions replayable failures", () => includes(text.portfolio, "replayable failures")],
  ["portfolio-23", "Portfolio discusses frontier AI teams", () => includes(text.portfolio, "frontier AI teams")],
  ["portfolio-24", "Portfolio does not use defensive private headline", () => no(text.portfolio, "private details kept private")],
  ["portfolio-25", "Portfolio meta says AI-native builder work", () => includes(files.portfolio, "AI-native builder work")],

  ["atlas-01", "Atlas hero identifies eval lab", () => includes(text.atlas, "Personal AI workflow and eval lab")],
  ["atlas-02", "Atlas says tool use", () => includes(text.atlas, "tool use")],
  ["atlas-03", "Atlas says memory", () => includes(text.atlas, "memory")],
  ["atlas-04", "Atlas says sensitive data boundaries", () => includes(text.atlas, "sensitive data boundaries")],
  ["atlas-05", "Atlas says scheduled work observable", () => includes(text.atlas, "scheduled work observable")],
  ["atlas-06", "Atlas includes core loop", () => includes(text.atlas, "Prompt to tool call to trace to eval to repair")],
  ["atlas-07", "Atlas tests source-of-truth discipline", () => includes(text.atlas, "Source-of-truth discipline")],
  ["atlas-08", "Atlas tests safe writes", () => includes(text.atlas, "safe writes")],
  ["atlas-09", "Atlas explains execution path reliability", () => includes(text.atlas, "execution path is reliable")],
  ["atlas-10", "Atlas names builder evidence", () => includes(text.atlas, "builder evidence")],
  ["atlas-11", "Atlas names failure modes", () => includes(text.atlas, "failure modes")],
  ["atlas-12", "Atlas names eval gates", () => includes(text.atlas, "eval gates")],
  ["atlas-13", "Atlas names inspectability", () => includes(text.atlas, "easier to inspect")],
  ["atlas-14", "Atlas names workflow replay", () => includes(text.atlas, "workflow replay")],
  ["atlas-15", "Atlas architecture includes handoffs", () => includes(text.atlas, "handoffs")],
  ["atlas-16", "Atlas architecture includes memory", () => includes(text.atlas, "memory")],
  ["atlas-17", "Atlas says prompts alone were not enough", () => includes(text.atlas, "prompts alone were not enough")],
  ["atlas-18", "Atlas says wrong path", () => includes(text.atlas, "wrong path")],
  ["atlas-19", "Atlas links back to selected work", () => includes(files.atlas, 'href="../portfolio.html#atlas"')],
  ["atlas-20", "Atlas meta says workflow and eval lab", () => includes(files.atlas, "workflow and eval lab")],

  ["css-01", "CSS defines builder proof grid", () => includes(files.styles, ".builder-proof-grid")],
  ["css-02", "CSS defines portfolio proof grid", () => includes(files.styles, ".portfolio-proof-grid")],
  ["css-03", "CSS defines Atlas hero", () => includes(files.styles, ".atlas-hero")],
  ["css-04", "CSS defines Atlas system card", () => includes(files.styles, ".atlas-system-card")],
  ["css-05", "CSS uses green accent for proof", () => includes(files.styles, "var(--accent-strong)")],
  ["css-06", "CSS uses existing 8px radius for proof", () => count(files.styles, "border-radius: 8px") >= 10],
  ["css-07", "CSS keeps mobile proof grids single column", () => /builder-proof-grid,[\s\S]*portfolio-proof-grid,[\s\S]*grid-template-columns: 1fr/.test(files.styles)],
  ["css-08", "CSS keeps Atlas hero single column on tablet", () => /atlas-hero,[\s\S]*portfolio-hero,[\s\S]*grid-template-columns: 1fr/.test(files.styles)],
  ["css-09", "CSS reduces mobile proof card height", () => includes(files.styles, "min-height: 0")],
  ["css-10", "CSS gives hero image breathing room on mobile", () => includes(files.styles, ".hero-image-card") && includes(files.styles, "margin-top: 28px")],
  ["css-11", "CSS keeps page palette warm", () => includes(files.styles, "--background: #f2ece3")],
  ["css-12", "CSS keeps secondary green accent available", () => includes(files.styles, "--accent-strong: #2f665d")],
  ["css-13", "CSS uses restrained shadows", () => includes(files.styles, "--shadow: 0 24px 70px")],
  ["css-14", "CSS preserves readable reader width", () => includes(files.styles, "--reader-width: 700px")],
  ["css-15", "CSS preserves mobile heading guardrails", () => includes(files.styles, "overflow-wrap: anywhere")],

  ["cross-01", "Candidate pages mention agent or agentic often", () => count(candidatePages, "\\b(agent|agentic|agents)\\b") >= 10],
  ["cross-02", "Candidate pages mention evals often", () => count(candidatePages, "\\bevals?\\b") >= 8],
  ["cross-03", "Candidate pages mention recovery often", () => count(candidatePages, "\\brecovery\\b") >= 8],
  ["cross-04", "Candidate pages mention workflow often", () => count(candidatePages, "\\bworkflow") >= 12],
  ["cross-05", "Candidate pages mention production", () => count(candidatePages, "\\bproduction\\b") >= 4],
  ["cross-06", "Candidate pages mention shipped", () => count(candidatePages, "\\bshipped\\b") >= 3],
  ["cross-07", "Candidate pages mention builder", () => count(candidatePages, "\\bbuilder") >= 5],
  ["cross-08", "Candidate pages mention frontier AI", () => count(candidatePages, "frontier AI") >= 3],
  ["cross-09", "Candidate pages include contact path", () => includes(files.home, "linkedin.com/in/chudaniel") && includes(files.home, "x.com/danielchu83")],
  ["cross-10", "Candidate pages do not lead with corporate title", () => count(candidatePages, "Partner Group Product Manager") === 0],
  ["cross-11", "Candidate pages do not describe bureaucracy", () => count(candidatePages, "bureaucr") === 0],
  ["cross-12", "Candidate pages avoid generic AI marketing claims", () => count(candidatePages, "transform your business") === 0],
  ["cross-13", "Candidate pages include safety/reliability language", () => hasAll(candidatePages, ["reliability", "safe writes", "sensitive data boundaries"])],
  ["cross-14", "Candidate pages include eval/replay/observability language", () => hasAll(candidatePages, ["eval", "replay", "observable"])],
  ["cross-15", "Azure deployment workflow is configured for main", () => includes(files.workflow, "Azure Static Web Apps CI/CD") && includes(files.workflow, "branches:") && includes(files.workflow, "- main")],
];

if (criteria.length !== 100) {
  console.error(`Expected exactly 100 evals, found ${criteria.length}.`);
  process.exit(1);
}

const results = criteria.map(([id, description, check]) => {
  let passed = false;
  let error = "";
  try {
    passed = Boolean(check());
  } catch (err) {
    error = err.message;
  }
  return { id, description, passed, error };
});

const failed = results.filter((result) => !result.passed);

console.log(`Personal site frontier-lab builder evals: ${results.length - failed.length}/${results.length} passed`);

if (failed.length) {
  for (const result of failed) {
    console.log(`FAIL ${result.id}: ${result.description}${result.error ? ` (${result.error})` : ""}`);
  }
  process.exit(1);
}

for (const result of results) {
  console.log(`PASS ${result.id}: ${result.description}`);
}
