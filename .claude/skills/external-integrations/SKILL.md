---
name: external-integrations
description: Step-by-step, plain-language walkthroughs for getting API keys/credentials for external providers this product needs (Twilio for voice calling today; WhatsApp Business API and LinkedIn planned). Load whenever a non-technical requester wants to connect a real external service — "let's use Twilio for calls", "connect WhatsApp", "hook up LinkedIn" — before writing any integration code, so they get walked through the provider's own signup/credential flow first.
---

# External integrations — getting credentials, step by step

The Comitai Dialer prototype (see `apps/frontend`'s Dialer/Health pages) assumes three
external channels: voice calling (Twilio), WhatsApp, and LinkedIn. None of these are
wired to a real provider yet — the dashboard runs on mock data. When someone non-technical
says "let's actually connect Twilio" (or WhatsApp, or LinkedIn), **don't start writing
integration code first.** Walk them through getting credentials, in plain language, one
step at a time, confirming each step actually worked before moving to the next. Never ask
them to paste a secret key into the chat — have them put it directly into the right `.env`
file (see below) and confirm only that they did it, not the value itself.

## General pattern for any provider

1. Explain in one sentence what the credential is for and where it'll live
   (`apps/backend/.env`, alongside `JWT_ACCESS_SECRET` etc. — never `apps/frontend/.env.local`,
   since anything prefixed `NEXT_PUBLIC_` is shipped to the browser and secrets never
   should be).
2. Give them the exact URL to sign up / find the credential in the provider's dashboard.
3. Tell them exactly what to name the env var and which file it goes in.
4. Ask them to confirm they've added it (a yes/no, not the value) before you write code
   that reads it — and add it to `env.validation.ts` (see `apps/backend/AGENTS.md`) so a
   missing credential fails loudly at boot instead of silently breaking calls later.
5. Only after the credential is in place, build the integration module (a new
   `apps/backend/src/<provider>/` feature module, following `backend-conventions`) and
   verify it against the provider's sandbox/test mode before touching production data.

## Twilio (voice calling) — do this first

Twilio is the most straightforward of the three: a real API key, official docs, and a free
trial with real (if limited) calling.

**Step 1 — Create a Twilio account**
Go to https://www.twilio.com/try-twilio and sign up (email + phone verification). No
credit card required for the trial.

**Step 2 — Get a phone number**
In the Twilio Console (https://console.twilio.com), under **Phone Numbers → Manage →
Buy a number**, get a trial number capable of Voice. It's free on a trial account.

**Step 3 — Find your credentials**
On the Twilio Console dashboard homepage, you'll see:
- **Account SID** — starts with `AC...`, safe to treat as an identifier (not fully
  secret, but still keep it server-side).
- **Auth Token** — click "show" to reveal it. This one is a real secret.

**Step 4 — Add them to the backend's env file**
Tell them to open `apps/backend/.env` (create it from `apps/backend/.env.example` if it
doesn't exist yet) and add:

```
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...        # the trial number from Step 2, E.164 format
```

**Step 5 — Confirm, then build**
Once they confirm those three lines are in `apps/backend/.env`:
1. Add corresponding fields to `EnvironmentVariables` in
   `apps/backend/src/config/env.validation.ts` (`@IsString() @IsNotEmpty()`) so a missing
   Twilio credential fails startup with a clear message instead of failing silently on
   the first call attempt.
2. Install the Twilio SDK: `pnpm --filter comitai-backend add twilio`.
3. Build a `dialer` (or `calls`) feature module on the backend following
   `backend-conventions` — a thin controller, a service that wraps the Twilio client,
   DTOs for whatever the frontend needs to send (e.g. which prospect to call).
4. **Trial-account caveat**: a Twilio trial account can only call phone numbers you've
   verified in the Console (**Phone Numbers → Verified Caller IDs**) and prepends a
   "trial account" message to calls. Tell the requester this explicitly — it's not a bug,
   it's how the free trial works, and they'll need to upgrade the Twilio account (add
   billing) before calling arbitrary prospect numbers in production.
5. Verify with a real trial call to a verified number before wiring the frontend Dialer
   UI to it — same "prove it against a real request before considering it done" standard
   as everything else in this repo.

## WhatsApp Business API — not yet documented here

Not covered step-by-step yet. When someone wants this connected: WhatsApp's official path
is the **WhatsApp Business Platform** via Meta (https://business.whatsapp.com/products/business-platform),
which requires a Meta Business account, app review, and (for most volume) a Business
Solution Provider or direct Cloud API access — meaningfully more setup than Twilio's
self-serve trial. Treat "connect WhatsApp" as its own feature request: research the
current Meta signup flow at the time it's asked for (it changes), then write a
step-by-step section here following the same pattern as the Twilio section above, and
update this skill's description once it's filled in.

## LinkedIn — not yet documented here

LinkedIn has no official public API for outbound messaging/connection-request automation
— the prototype's LinkedIn actions are explicitly manual in the UI copy ("Envio continua
manual e sujeito a hard limits" on the Health page) for exactly this reason. Automating it
for real means either LinkedIn's official (restrictive, partner-gated) APIs or a
third-party automation tool, which carries account-suspension risk Twilio/WhatsApp don't.
**Flag this trade-off explicitly to the requester before building anything** rather than
silently picking an approach — this is a business/risk decision, not a technical one.
