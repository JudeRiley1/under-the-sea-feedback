# Under The Sea - Field Journal

A shared playtest journal at https://juderiley1.github.io/under-the-sea-feedback/.

## Using the journal

Choose Bugs or Improvements, then Add. Paste a screenshot with Ctrl+V (Cmd+V on Mac), drop an image, or choose a file. Write a description, choose Low, Medium or High priority, and Submit. No sign-in is required. Reports and screenshots are public.

The popup accepts up to four PNG, JPG or WebP images and resizes them for upload. Failed submissions retain the draft; retries use an idempotency key to avoid duplicates. Cancelling the popup keeps the current draft until the page is reloaded.

Open a report to view screenshots. Click the current status in the board or report details to choose Open, In progress, Ready to test, Done, Reopened or Not planned. Anyone with the journal link can change a status; the board and summary update after saving. Failed saves keep the previous status. Legacy GitHub issues retain their GitHub editing links.

## Hosting and storage

GitHub Actions publishes the static frontend from main. New reports are stored in D1 and screenshots in R2 through the public Sites service at https://under-the-sea-feedback-api.judeyboy12.chatgpt.site. The service has a separate managed source repository; its local checkout is services/feedback-api. It does not need a GitHub token.

The board merges this service's reports with older GitHub issues. Both sources are paginated. Failed refreshes retain previously loaded reports and display a notice. Status summaries cover both tabs: Open includes Open and Reopened; In progress, Ready to test and Resolved are separate counts.

Anonymous creation is restricted to the journal browser origin, validated on the server, and rate limited to 12 new reports per hour per address and 200 per day overall. Status changes are public and limited to 120 per hour per address and 2,000 per day overall. Deleting a report still requires its own key; only its hash is stored server-side. Server uploads are limited to four raster images of 4 MB each. No admin credential is shipped in the frontend.

## Development

- index.html and style.css: teal-and-parchment journal and popup.
- app.js and model.js: board, legacy GitHub parsing, filters and screenshots.
- feedback.js: anonymous uploads, image compression, draft and edit-key handling.
- services/feedback-api: separately published Worker, schema migrations and storage tests.

Run `node --test model.test.mjs` for the legacy parser. In the service checkout run `npm test` for upload persistence, validation, authorization, CORS, retry and cleanup checks, and `npm run build` for the Worker build. Database schema changes use `npm run db:generate`; never change applied migrations.

A local static preview can read the shared board. Production writes only accept the GitHub Pages origin. Local service tests use an isolated database and object store. The public service was also verified with a temporary upload which was deleted after testing.

Tabs support arrow keys, Home and End; `/` focuses search. Printing includes both tabs. Mobile layouts use stacked report cards.
