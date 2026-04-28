# personalweb

Simple personal website for Daniel Chu.

## Preview locally

Open `index.html` in a browser, or run a tiny static server:

```bash
python3 -m http.server 4173
```

Then visit `http://127.0.0.1:4173/index.html`.

## Positioning

Daniel is a product person working on AI, agents, and enterprise workflows.

The site is intentionally modest: working notes, small product explorations, and
plainspoken questions about why AI products often work in demos but break in real
workflows.

## Content model

- There is no CRUD surface or CMS.
- New writing is published by adding or editing static HTML files under
  `articles/` and linking them from `index.html`.
- Project pages live under `projects/` and can group related writing.
- Atlas is the primary project page for now, with a public-safe architecture
  overview and links to related technical notes.

## Analytics

The site has a Microsoft Clarity integration point in `scripts/analytics.js`.
Add your Clarity project ID to `scripts/config.js` to enable tracking.

## TODOs

- Replace placeholder LinkedIn, X, email, and resume links.
- Add the Clarity project ID when the analytics project is created.
- Expand the smaller project explorations when they have enough public material.
