# personalweb

Simple personal website for Daniel Chu.

## Preview locally

Open `index.html` in a browser, or run a tiny static server:

```bash
python3 -m http.server 4173
```

Then visit `http://127.0.0.1:4173/index.html`.

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

## Positioning

Daniel is a product leader working on AI agents and enterprise workflows.

The site is a personal portfolio for AI product explorations, agent workflows,
and notes on building reliable AI systems for real workflows. It is designed to
make Atlas and other hands-on product work easy to scan before readers dive into
the related notes.

## Content model

- There is no CRUD surface or CMS.
- New writing is published by adding or editing static HTML files under
  `articles/` and linking them from `index.html`.
- Project pages live under `projects/` and can group related writing.
- Atlas is the primary project page for now, with a public-safe architecture
  overview and links to related technical notes.

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

- Replace the placeholder email address.
- Add the Google Analytics measurement ID.
- Expand the smaller project explorations when they have enough public material.
