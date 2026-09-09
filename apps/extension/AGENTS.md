# Comitai LinkedIn extension — project conventions

A Chrome/Chromium Manifest V3 extension with two jobs:

1. **Read** (item 10): while a BDR browses a LinkedIn profile, it verifies that
   profile's current role/company against the matching Comitai `Person`
   (`POST /v1/linkedin/observe`, apps/backend `src/linkedin/`) and updates Comitai when
   they've changed — LinkedIn is treated as the source of truth for role/company. It
   also reads the profile's connection-degree badge to detect an accepted connection
   request, since LinkedIn has no webhook for that.
2. **Action** (item 11): surfaces AI-drafted LinkedIn connect notes/messages the Play
   Engine queued up, so the BDR can act on them from the popup.

Plain JavaScript, no build step, no bundler, no TypeScript — loaded directly as an
unpacked extension. Don't introduce a build tool unless the extension outgrows what a
handful of flat files can do; that's a deliberate choice, not an oversight.

## Architecture

```
manifest.json       Manifest V3 config — permissions, content script matches
background.js       Service worker — the ONLY file that talks to the Comitai API
content-script.js   Runs on linkedin.com/in/* — scrapes the DOM, nothing else
popup.html/popup.js Login UI + API base URL setting + pending LinkedIn actions queue
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
`.text-body-medium.break-words`, and `readConnectionDegree()`'s `.dist-value`) are
LinkedIn's long-documented profile markup as of this writing, **not verified against a
live page** — this sandbox has no browser to check against. LinkedIn changes its DOM
without notice; when observations stop landing:

1. Open a real profile page, DevTools console, filter for `[Comitai]` — every attempt
   logs what it captured.
2. If the captured `name`/`headline` is `null` or wrong, inspect the current markup and
   update the selectors in `readProfile()`.
3. Prefer parsing the headline text over crawling the Experience section — a profile's
   headline is a single stable element; the Experience section's markup is deeply
   nested and has historically changed more often.

## LinkedIn action — semi-assisted by design, not automated

**This extension never clicks LinkedIn's own Connect/Message button, and never will.**
Simulating that click is browser automation of LinkedIn's UI — exactly what gets
accounts restricted, and the reason the design explicitly calls LinkedIn action "high
compliance risk". Instead:

1. `PlayEngineService` (`apps/backend/src/play-engine/`) drafts the note/message with AI
   and creates a `LINKEDIN_CONNECT`/`LINKEDIN_MESSAGE` `Action`, gated by the cadence's
   `ApprovalMode` like any other AI-authored action.
2. The popup's "Ações pendentes" list (`GET /v1/linkedin/actions/pending`, rate-limited
   server-side — see `MAX_CONNECT_PER_DAY`/`MAX_MESSAGE_PER_DAY` in
   `LinkedInService`) shows each one with a link to the person's profile and the drafted
   text.
3. The BDR opens the profile and performs the action **themselves**, in their own
   LinkedIn UI, then clicks "Feito" (`POST /v1/linkedin/actions/:id/complete`) or "Pular"
   (`.../skip`) in the popup to resolve it.

Acceptance detection has the same "no webhook" limitation as the rest of this
extension: a `CadenceStep.waitForConnectionAccepted` gate is only ever satisfied when
this extension later observes the profile's connection-degree badge having become
"1st" (`readConnectionDegree()` in `content-script.js` → `linkedin.connection.accepted`
ProspectEvent). If the BDR never revisits that profile, the gate never fires — there is
no polling or push mechanism beyond normal browsing.

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
