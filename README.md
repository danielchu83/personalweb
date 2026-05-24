# personalweb

Simple personal website for Daniel Chu.

## Preview locally

Open `index.html` in a browser, or run a tiny static server:

```bash
python3 -m http.server 4173
```

Then visit `http://127.0.0.1:4173/index.html`.

## Homepage concept studies

Three alternate homepage concepts are available for comparison:

- `concepts.html` - comparison index linking to all three directions.
- `concept-lab-bench.html` - dark R&D bench for AI product experiments.
- `concept-studio-notebook.html` - warm product studio notebook.
- `concept-failure-museum.html` - curated gallery of AI product failure modes.

## Hosting on Azure

Use Azure Static Web Apps for this site. It is a better fit than the existing
VM because the site is static HTML/CSS/JS and does not need a server process.

Recommended setup:

1. Create an Azure Static Web App.
2. Connect it to the GitHub repository.
3. Use these build settings:
   - App location: `/`
   - API location: leave blank
   - Output location: leave blank
4. Keep `staticwebapp.config.json` at the repository root.

Azure Static Web Apps has a Free plan, which should be enough for this personal
site unless traffic becomes unusually high.

## Direction

This is Daniel Chu's AI systems lab notebook for technology explorations.

The main site currently follows the Product Lab Bench direction: a dark,
ultraviolet R&D surface for experiments, diagrams, field notes, artifacts, and
open questions from exploring AI agents, tools, workflows, product reliability,
and software design. It should feel curious, technical, precise, humble, and
alive rather than like a resume or positioning page.

## Content model

- There is no CRUD surface or CMS.
- New writing is published by adding or editing static HTML files under
  `articles/` and linking them from `index.html`.
- Work-in-progress articles use the `articles/wip-*.html` naming convention.
  These pages are deployed online but protected by Azure Static Web Apps route
  roles, so only an account with the `owner` role can view them.
- Keep WIP articles out of `index.html` until they are ready to publish.
  To publish a WIP article, remove the `wip-` prefix from the filename and add
  the public links to `index.html`.
- Project pages live under `projects/` and can group related field notes.
- Atlas is the primary exploration page for now, with a public-safe architecture
  overview and links to related notes.

## WIP article access

The `staticwebapp.config.json` file protects `articles/wip-*` with the custom
`owner` role and sends unauthenticated visitors to GitHub sign-in.

After deploying this config, add your GitHub account to the `owner` role in the
Azure Static Web Apps resource:

1. Open the Static Web Apps resource in the Azure portal.
2. Go to Settings > Role Management.
3. Invite your GitHub username with the role `owner`.
4. Accept the invite while signed in to that GitHub account.

If you prefer Microsoft Entra ID sign-in, change the GitHub login routes in
`staticwebapp.config.json` from `/.auth/login/github` to `/.auth/login/aad`.

## Analytics

The site supports Google Analytics 4 through `scripts/analytics.js`.

To enable it, create a GA4 web stream and add the measurement ID to
`scripts/config.js`:

```js
window.personalWeb = {
  analytics: {
    googleAnalyticsId: "G-XXXXXXXXXX",
    clarityProjectId: "",
  },
};
```

Microsoft Clarity is still available as an optional secondary analytics tool by
setting `clarityProjectId`.

## TODOs

- Add the Google Analytics measurement ID.
- Replace artifact placeholders with real diagrams, sketches, or prototypes.
