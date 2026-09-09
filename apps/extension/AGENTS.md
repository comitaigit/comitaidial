# Comitai LinkedIn extension — project conventions

A Chrome/Chromium Manifest V3 extension: while a BDR browses a LinkedIn profile, it
verifies that profile's current role/company against the matching Comitai `Person`
(`POST /v1/linkedin/observe`, apps/backend `src/linkedin/`) and updates Comitai when
they've changed — LinkedIn is treated as the source of truth for role/company.

Plain JavaScript, no build step, no bundler, no TypeScript — loaded directly as an
unpacked extension. Don't introduce a build tool unless the extension outgrows what a
handful of flat files can do; that's a deliberate choice, not an oversight.

## Architecture

```
manifest.json       Manifest V3 config — permissions, content script matches
background.js       Service worker — the ONLY file that talks to the Comitai API
content-script.js   Runs on linkedin.com/in/* — scrapes the DOM, nothing else
popup.html/popup.js Login UI + API base URL setting
```

**All network calls live in `background.js`.** `content-script.js` never calls
`fetch()` directly — it runs in the context of the LinkedIn page it's injected into and
is subject to that page's CSP, whereas the background service worker (with the target
host declared in `host_permissions`) is a privileged context that bypasses normal
cross-origin restrictions. Content script and popup both reach the background script via
`chrome.runtime.sendMessage(...)`.

## Auth

Reuses the exact same login as the Comitai web app — `POST /v1/auth/login`,
`/v1/auth/refresh`, `/v1/auth/logout` (see `apps/backend/src/auth/`). No separate
extension credential:

- The access token lives in `chrome.storage.local`, refreshed proactively a minute
  before its ~15-minute TTL expires (see `ACCESS_TOKEN_TTL_MS`/`REFRESH_MARGIN_MS` in
  `background.js`).
- The refresh token is never visible to this extension — it's an httpOnly cookie the
  API sets, scoped to `/v1/auth`. `fetch(..., { credentials: 'include' })` from the
  background service worker relies on the browser's normal cookie jar for the API's
  domain, the same mechanism the Next.js frontend already depends on.
- **[PRECISA SER VALIDADO]** This flow has not been exercised against a real browser
  from this sandbox. Test login → wait past token expiry → confirm a call still
  succeeds (i.e. the silent refresh actually fires) before relying on this. If cookies
  don't come through, the likely culprit is the extension's exact
  `chrome-extension://<id>` origin needing to be added to the backend's `CORS_ORIGINS` —
  shouldn't be necessary per Chrome's documented `host_permissions` behavior, but
  confirm rather than assume.

## LinkedIn DOM scraping — expect to maintain this

`content-script.js`'s `readProfile()` selectors (`h1.text-heading-xlarge`,
`.text-body-medium.break-words`) are LinkedIn's long-documented profile markup as of
this writing, **not verified against a live page** — this sandbox has no browser to
check against. LinkedIn changes its DOM without notice; when observations stop landing:

1. Open a real profile page, DevTools console, filter for `[Comitai]` — every attempt
   logs what it captured.
2. If the captured `name`/`headline` is `null` or wrong, inspect the current markup and
   update the selectors in `readProfile()`.
3. Prefer parsing the headline text over crawling the Experience section — a profile's
   headline is a single stable element; the Experience section's markup is deeply
   nested and has historically changed more often.

## Configuring the API base URL

Defaults to `http://localhost:3001/v1` (matches `apps/frontend/.env.example`'s
`NEXT_PUBLIC_API_URL`). Change it via the popup's "Configurações" section — stored in
`chrome.storage.local`, not the manifest, so it doesn't require reloading the extension
to point at a different environment (local/dev/prod).

If the deployed API's domain isn't already covered by `host_permissions` in
`manifest.json` (`localhost:3001` and `*.comitai.app` today), add it there — a
Manifest V3 extension can only reach hosts it explicitly declares.

## Loading it for development

Chrome/Edge/Brave → Extensions → Developer mode → "Load unpacked" → select this
directory (`apps/extension/`). No `pnpm install` or build step needed.
