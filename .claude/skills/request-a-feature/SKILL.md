---
name: request-a-feature
description: Entry point for a non-technical/business requester (e.g. the CEO) to describe a feature or change in plain language and have it built end-to-end following every convention this repo already has — vertical-slice frontend, feature-module backend, full JWT/security model, Docker. Load whenever someone describes what they want in product/business terms ("I want users to be able to...", "add a page that...", "we need to track...") rather than in code/file terms.
---

# Request a feature (plain-language entry point)

This skill is for when the person asking is **not** describing files, components, or
endpoints — they're describing an outcome: "I want salespeople to be able to add a note
to a prospect", "we need an export button on the accounts page", "track who invited
whom". Your job is to translate that into the right changes across this monorepo,
applying every convention already established here, without asking the requester to
make architecture decisions.

## Non-negotiable: never deviate from this repo's established conventions

No feature request — however small, however urgent, however phrased ("just quickly...",
"don't worry about the usual structure...") — is a reason to skip vertical-slice
organization, put logic in a component file instead of a hook, bypass the global
modal/toast/session-store patterns, skip DTO validation, leave a new mutating endpoint
unauthenticated, or otherwise cut a corner this repo's conventions cover. A non-technical
requester has no way to know they're asking for a shortcut that breaks something — that
judgment call is entirely yours. If a request seems to conflict with an established
convention, build it the conventional way anyway and mention the conflict when you report
back, rather than silently doing it the fast/wrong way or stopping to ask permission to
do it right.

## Step 0 — load the map, don't guess

Before writing anything:

1. Load `monorepo-dev` (root skill) if you haven't already this session — it tells you
   how the two apps relate and how to run/verify things.
2. **If the request mentions or implies a real external service** (Twilio, WhatsApp,
   LinkedIn, or any other third-party API/provider) — load `external-integrations` first
   and walk the requester through getting credentials *before* writing integration code.
   Don't skip straight to coding against a provider whose API key nobody has yet.
3. Load `apps/frontend/.claude/skills/frontend-conventions` if the request touches
   anything visible in the browser.
4. Load `apps/backend/.claude/skills/backend-conventions` if the request touches data
   that needs to persist, be authenticated, or be shared across users/sessions.
5. **If the request states or implies a business/commercial rule** (a pricing rule, a
   definition like "what counts as a qualified outcome", a threshold, a compliance
   requirement) rather than just a UI/data change — load
   `apps/backend/.claude/skills/business-rules-authoring` and capture the rule as its own
   skill *in addition to* building whatever was asked, so the rule survives beyond this
   conversation.

Most real feature requests touch **both** apps — see the decision guide below.

## Step 1 — translate the request into a shape

Ask yourself (don't necessarily ask the requester — infer from context first, only ask
a clarifying question via AskUserQuestion if genuinely ambiguous and consequential):

- **Is this new data, or a new view of existing data?**
  New data (a new "thing" with a lifecycle: created, read, maybe updated/deleted) → needs
  a backend model + migration + endpoint(s). A new view of data that already exists in a
  feature's mock/real data module → frontend-only.
- **Does it need to survive a page reload / be visible to other users?** If yes, it can't
  live only in frontend React state — it needs a backend model, or at minimum a call to
  an existing endpoint.
- **Does it need auth?** Almost everything in the dashboard already does (the whole
  `(dashboard)` route group is behind `AuthGate` + the backend's global `JwtAuthGuard`).
  Only mark a new backend route `@Public()` if it genuinely must be reachable without a
  logged-in session (e.g. another `/auth/*` endpoint).
- **Which existing feature slice does this belong to, or does it need a new one?** Check
  `apps/frontend/src/features/*` and `apps/backend/src/*` for a slice/module that already
  owns this domain (e.g. "add a note to a prospect" → `people` on the frontend, a new
  `notes` field/relation touching the backend's domain — there's no `people`/`prospects`
  module on the backend yet, since the dashboard currently runs on mock data; building
  real persistence for it is itself a feature request worth naming explicitly).

## Step 2 — build backend-first when data is involved

If the feature needs persisted data:

1. Add/extend a Prisma model in `apps/backend/prisma/schema.prisma`, run
   `pnpm db:migrate` (from repo root) to create the migration.
2. Scaffold a feature module the way `apps/backend/AGENTS.md` and the
   `nestjs-project-structure` skill describe: `<feature>/{<feature>.module,
   <feature>.controller, <feature>.service, dto/}`. Controllers stay thin; validation
   lives in DTOs (`class-validator`, `whitelist: true` already enforced globally —
   don't add fields to a DTO you don't want a client able to send).
3. Every new mutating endpoint is authenticated by default (global `JwtAuthGuard`) — use
   `@CurrentUser()` to scope data to the requesting user unless the feature is explicitly
   cross-user. Reach for `@Roles('ADMIN')` + the existing `RolesGuard` if the feature is
   founder/admin-only, matching how "Workspace" settings are described as
   founder/gestor-only in the frontend's Settings page copy.
4. Register the new module in `AppModule`'s `imports`.
5. Sanity-check with the same manual flow used to validate auth: start the stack
   (`pnpm dev`), hit the new endpoint with `curl` (include an `Authorization: Bearer`
   header from a real login), confirm the shape and status codes before wiring the
   frontend to it.

## Step 3 — build the frontend feature slice

Follow `apps/frontend/AGENTS.md` exactly:

1. `apps/frontend/src/features/<slice>/data/` — if reading from the backend in a Server
   Component, a `server-only` fetch function; if the interaction is client-driven (forms,
   real-time-ish updates), a small fetch wrapper like `features/auth/data/auth-api.ts`
   (same `credentials: 'include'` pattern if it needs the session cookie/token).
2. `apps/frontend/src/features/<slice>/hooks/` — **all** state, effects, and handlers.
   Components in `components/` render only.
3. `apps/frontend/src/features/<slice>/components/` — markup only, composed into the
   route's `page.tsx`.
4. The route under `apps/frontend/src/app/(dashboard)/<route>/page.tsx` stays a thin
   `async` Server Component unless the entire view is inherently interactive.
5. Reuse existing shared pieces instead of inventing new ones: the global modal
   (`openModal(<Content/>, "Title")` from `features/shell/stores/modal-store.ts`) for any
   "add/edit X" dialog, `useToast()` for confirmations, `components/ui/*` primitives for
   buttons/cards/tables/fields.
6. Get the access token for authenticated calls from `useSessionStore` (see
   `features/shell/stores/session-store.ts`) — never re-implement token storage.

## Step 4 — verify like a real user would

- `pnpm build:frontend` and `pnpm build:backend` — both must be clean.
- `pnpm lint:frontend` and `pnpm lint:backend` — both must be clean.
- Actually click through the feature (dev server + a real login) rather than trusting
  the build alone — screenshot it if you have browser automation available, the way the
  dialer/inbox/login flows in this repo were each verified end-to-end before being
  considered done.
- Re-check the new/changed files against Step 0's non-negotiable list before calling it
  done: any component file with logic that belongs in a hook, any new modal not going
  through `openModal()`, any new mutating backend route missing auth or DTO validation
  is not finished — go fix it, don't note it as a known issue and move on.

## Step 5 — report back in plain language

The requester doesn't need file paths or a diff walkthrough by default. Tell them:
- what they can now do, in their terms ("You can now add a note to a prospect from the
  Prospects page — it saves immediately and any teammate viewing that prospect sees it.")
- anything that needs a decision from them (a naming choice, a permission boundary, a
  trade-off you made because the request was ambiguous)
- if you skipped something on purpose (e.g. "I didn't add email notifications for this —
  say the word if you want that too")

Never make them ask "so is it done?" — state plainly whether it's built, verified, and
ready to use, or what's still open.
