<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Comitai Dialer — project conventions

Comitai Dialer is a multichannel outbound console (voice dialer, unified WhatsApp/LinkedIn inbox,
accounts, prospects, sequences, metrics, channel health, workspace settings) built on Next.js
16 App Router. Read this before adding or changing code.

## Architecture: vertical slice

Code is organized **by feature, not by technical layer**. Each feature under `src/features/<name>/`
is self-contained:

```
src/
  app/
    (dashboard)/<route>/page.tsx   → thin: fetch via the slice's data module, compose slice components
  features/
    <slice>/
      data/       server-only data access (fetch/DB simulation), marked with `import "server-only"`
      components/ markup only — see "Components are markup-only" below
      hooks/      all state, effects, event handlers, and derived logic for this slice's
                  client components (`useDialer.ts`, `useInboxWorkspace.ts`, ...)
      stores/     slice-local Zustand stores, if any
    shell/        the one legitimately cross-cutting slice: Sidebar, Topbar, ToastProvider,
                  GlobalModal, and the global modal store — mounted once in app/(dashboard)/layout.tsx
                  (same data/components/hooks/stores split as any other slice)
  components/ui/  generic, feature-agnostic primitives only (Card, Tag, Button, Table, Field, Bar,
                  PersonAvatar, PageHeader) — promote something here only once 2+ features actually
                  duplicate it, never speculatively
  lib/            small cross-cutting utilities (e.g. cn())
```

Rules:
- A route under `app/` never contains business logic or markup beyond composing its feature's
  components — the page's job is `await getX()` then render.
- Feature slices do not import from each other's internals. Cross-feature navigation goes through
  `next/link` (a URL), not a component import.
- Don't create a folder for a slice until it exists; don't extract to `components/ui/` until
  duplication is real (see `react-vertical-slice` principles this structure follows).

## Components are markup-only

**Every file under `components/` is JSX and nothing else — no `useState`, `useEffect`, `useRef`,
event handler bodies, or derived-value computation.** If a component needs any of that, extract
it into a hook in that slice's `hooks/` folder (`features/<slice>/hooks/useThing.ts`) and have
the component call the hook for its data/handlers, e.g.:

```tsx
// features/dialer/hooks/useDialerStage.ts
"use client";
export function useDialerStage(block: DialerBlockData) {
  const [dialing, setDialing] = useState(false);
  // ...all state, effects, handlers...
  return { dialing, lines, startDial, stopDial, /* ... */ };
}

// features/dialer/components/DialerStage.tsx
"use client";
import { useDialerStage } from "@/features/dialer/hooks/useDialerStage";
export function DialerStage({ block }: { block: DialerBlockData }) {
  const { dialing, lines, startDial, stopDial } = useDialerStage(block);
  return ( /* markup only, reading from the hook's return value */ );
}
```

This applies even to small components — a single `onClick` that calls `toast(...)` still moves
into a one-line hook (or a shared hook like `useToast()`) rather than living inline in the JSX
file. `"use client"` still goes on both the hook file (if it uses client-only APIs) and the
component file that calls it.

## Server-first by default

- Every `page.tsx` is a Server Component (`async function ... { const data = await getX() }`).
  Data fetching happens in `features/<slice>/data/*.ts`, files that start with `import "server-only"`
  so a client import fails the build loudly instead of leaking mock/DB logic to the bundle.
- Add `"use client"` only to the smallest component that actually needs state, effects, or browser
  event handlers (e.g. `DialerStage`, `InboxWorkspace`, one button that opens a modal) — never to a
  whole page or a whole slice.
- Prefer this split: a Server Component page renders mostly-static layout and passes server-fetched
  data as props into one focused Client Component for the interactive part.

## Global modal (Zustand)

There is exactly one modal mount point: `<GlobalModal />` in `app/(dashboard)/layout.tsx`, backed by
`features/shell/stores/modal-store.ts`. Feature code never renders its own overlay/dialog chrome.
To open a modal from anywhere:

```tsx
import { openModal, closeModal } from "@/features/shell/stores/modal-store";

openModal(<NewAccountForm />, "Nova account"); // content is *just* the inner form/body
// ...
closeModal();
```

`<NewAccountForm />` etc. contain only the form fields and the submit button — no overlay, no
header, no close button. `GlobalModal` supplies all of that chrome once. See
`features/accounts/components/{NewAccountButton,NewAccountForm}.tsx` for the reference pair.

## Toasts

Same pattern as the modal: one `<ToastProvider>` in the dashboard layout, consumed via
`useToast()` from `features/shell/hooks/useToast.ts` (the provider component itself is
markup-only — its state lives in `useToastProviderState()` in that same hooks file). Don't
build a second toast system.

## Styling

Tailwind v4 (`@theme inline` tokens in `src/app/globals.css`, mapped from the original prototype's
CSS custom properties: `--accent`, `--line`, `--muted`, `--ok`, `--warn`, `--bad`, etc.). Compose
utilities in `components/ui/` primitives rather than repeating class strings across features.

## Before writing App Router code

This repo ships the Next.js docs locally at `node_modules/next/dist/docs/01-app/` — treat
`01-getting-started/` and `02-guides/` there as the source of truth over training-data assumptions,
per the block above.
