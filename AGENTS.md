# Personalweb Agent Instructions

## Mandatory Browser Check

After every code, content, style, config, or asset change in this repository,
open the affected page in Codex's built-in browser before giving the final
response.

Use this workflow:

1. Start or reuse a local static server for the repo root.
2. Use the Codex Browser plugin / in-app browser (`iab`) to open the relevant
   page at `http://127.0.0.1:4173/`.
3. If the changed surface is visual, check both desktop and mobile-sized
   viewports.
   Mobile preview is a standing requirement for user-visible changes so the
   site can be checked before production deploys.
4. Verify the page is not blank, has no framework/browser error overlay, and
   has no relevant console errors.
5. Exercise at least one relevant navigation or interaction when the change
   touches links, buttons, layout, scripts, or user-visible content.
6. Mention the browser check in the final response, including the page and
   viewport(s) checked.

For broad or shared changes, check the homepage plus one representative article
or project page. For concept-only changes, check the affected concept page.

Do not satisfy this requirement with macOS `open`, Chrome, or an external
browser unless the Codex built-in browser is unavailable and the final response
states the fallback reason.

Do not claim the change is complete until this browser check has happened.
