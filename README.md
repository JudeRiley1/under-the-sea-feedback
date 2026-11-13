# Playtest - Game Review Hub

A shared game feedback site at https://juderiley1.github.io/under-the-sea-feedback/.

Choose **Under the Sea** or **Popcorn Overload**, then **Bugs** or **Improvements**. Use Add to submit a description, priority, and up to four PNG, JPG or WebP screenshots. Images can be pasted, dropped, or selected. Each game and report type keeps a separate draft until reload. Failed submissions retain the draft and retry safely.

The default **Active feedback** filter hides Done and Not planned reports. Use All statuses or an individual status to review them again. Status changes save immediately; failed saves retain the previous value. Summary counts include all reports for the selected game, while tab counts reflect the current filter/search. Tabs support arrow keys, Home and End. `/` focuses search.

## Administrator deletion

Only the administrator can delete feedback. Use **Admin sign in** at the bottom of the board and enter the private admin key, then use Delete in a row or report details. A confirmation is required. Deletion removes the report and its screenshots for everyone. Failed deletions retain the report for retry. Sign out or reload to clear the in-memory admin session.

The service verifies a SHA-256 hash against the secret runtime variable `ADMIN_KEY_HASH`. No admin key is shipped with the site, stored in browser storage, or committed to Git. Rotating the key requires updating that Sites runtime secret and redeploying. The initial key is delivered privately to the owner in an ignored local file.

## Downloads

Download cards sit above the board. Under the Sea uses `builds.json`, maintained by its existing publisher, for its version and release notes. Its download is pinned to that version's release so another game's release cannot redirect it. Popcorn Overload links directly to the standalone Windows executable in the `popcorn-2026-11-13` release, which is not marked as the repository's latest release.

## Hosting and storage

GitHub Actions publishes the static frontend from main. Reports are stored in D1 and screenshots in R2 through the public Sites service at https://under-the-sea-feedback-api.judeyboy12.chatgpt.site. The service has its own managed source repository in `services/feedback-api`.

The additive game migration assigns existing feedback to Under the Sea. Older GitHub reports are still read and assigned to Under the Sea; these use GitHub's own management links. New reports persist their game on the server. Both report sources are paginated, and failed refreshes retain loaded reports. A refresh that overlaps a successful mutation cannot restore stale data.

Anonymous creation and status changes are restricted to the GitHub Pages browser origin and rate limited. Creation allows 12 per hour per address and 200 per day; status and administrator operations allow 120 per hour per address and 2,000 per day. Deletion checks administrator credentials server-side. Uploads are limited to four raster images of 4 MB each, with client-side compression. Existing per-report edit hashes remain for submission retry compatibility, but do not authorize deletion.

## Development

- `index.html` / `style.css`: responsive general game hub, downloads, and dialogs.
- `games.js`: game catalog and status filter behavior.
- `app.js` / `model.js`: board, legacy GitHub parsing, filters and screenshots.
- `feedback.js`: submissions, separate drafts, image compression, admin session and deletion.
- `services/feedback-api`: Worker, additive schema migrations and storage tests.

Run `npm ci` then `npm test` for parser and DOM interaction checks. In the service checkout run `npm test` and `npm run build`. Tests use isolated DOM/database/object storage and mock network responses, with no live writes. Generate schema changes with `npm run db:generate`; never change applied migrations. Sites applies hosted migrations during deployment.

Local previews cannot make production writes because the API only allows the GitHub Pages origin. Print shows both feedback types for the selected game using the current filters. Mobile layouts use stacked report cards.
