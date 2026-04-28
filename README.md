# personalweb

Personal website for Daniel Chu: technical field notes, Atlas learnings, and
personal essays.

## Preview locally

Open `index.html` in a browser. The site is plain HTML and CSS, so it does not
need a build step yet.

## Content model

- Atlas notes should explain architecture, debugging, privacy boundaries, and
  lessons learned without publishing source code or personal data.
- Technical posts should be concrete learning logs for systems, AI, and product
  engineering.
- Personal posts should cover recent lessons, taste, habits, attention, and
  reflections outside a project repo.
- There is no CRUD surface. New writing is published by adding or editing static
  HTML files under `articles/` and linking them from `index.html`.

## Article pages

- Article cards on the homepage link directly to static article pages.
- Each article page includes a back-home link and a share button.
- The share button uses the native share sheet when available and copies the URL
  to the clipboard as a fallback.

## Analytics

The site has a Microsoft Clarity integration point in `scripts/analytics.js`.
Add your Clarity project ID to `scripts/config.js` to enable tracking.

Analytics can show sessions, page views, referrers, devices, browsers, broad
location, and timelines. It cannot identify an exact person unless visitors
authenticate or otherwise identify themselves.

## Next edits

- Replace draft article titles with real post links.
- Update `mailto:hello@example.com` with the right contact address.
- Add the Clarity project ID when the analytics project is created.
