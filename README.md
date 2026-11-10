# Under The Sea — Field Journal

A public, shared playtest journal hosted on GitHub Pages. GitHub Issues stores reports, screenshots, discussion, and status.

## Using the journal
- Open https://juderiley1.github.io/under-the-sea-feedback/
- Choose **Report a bug** or **Suggest an improvement**.
- Sign in to GitHub. Paste or drag screenshots into the Screenshots field, describe the issue, and submit.
- Return to the journal and click **Refresh**.
- Click thumbnails for full-size images. Open a report for details and an **Edit / discuss on GitHub** link.

**Everyone sees the same reports.** This is public; do not upload private material. No token is embedded in the page. GitHub controls who can edit reports.

## Status
The journal reads the report's Status field (Open, In progress, Ready to test, Reopened).
Closing an issue marks it Done (or Not planned when that closing reason is selected).
Maintainers can also apply status labels with the same names.

## Hosting
GitHub Actions deploys the static journal from main. No installation or build step.
The page fetches public issues from GitHub on load and on Refresh. It paginates without dropping older reports.
If the API is unavailable or rate limited, a clear message links to the canonical GitHub issue list; previously loaded entries stay visible.

## Files
- index.html, style.css: themed journal
- app.js, model.js: shared records, filtering, safe rendering, expandable screenshots
- .github/ISSUE_TEMPLATE: two screenshot-friendly forms
- assets: compass artwork

Run parser tests: `node --test model.test.mjs`.
