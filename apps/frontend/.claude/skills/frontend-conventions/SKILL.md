---
name: frontend-conventions
description: Comitai Dialer frontend (apps/frontend) coding conventions — vertical-slice architecture, server-first Next.js App Router, the global Zustand modal/toast pattern. Load before adding or changing any code under apps/frontend (new route, new feature slice, new component, new modal).
---

# Frontend conventions

This app's conventions live in **[apps/frontend/AGENTS.md](../../../AGENTS.md)**
(also loaded via `apps/frontend/CLAUDE.md`, which is just `@AGENTS.md`) — read it in full before
writing frontend code. For backend code see the `backend-conventions` skill instead.

It covers:
- **Vertical-slice architecture**: `src/features/<slice>/{data,components,hooks,stores}`, what
  belongs in `components/ui/` vs a slice, and why routes under `src/app/` stay thin.
- **Components are markup-only**: all state/effects/handlers live in a slice's `hooks/` folder.
- **Server-first defaults**: pages are `async` Server Components that `await` a `server-only`
  data module; `"use client"` is scoped to the smallest interactive component.
- **The global modal pattern**: one `<GlobalModal />` + Zustand store
  (`features/shell/stores/modal-store.ts`) — call `openModal(<Content />, "Title")` from anywhere,
  never render a second overlay.
- **The global toast pattern**: one `<ToastProvider>` / `useToast()`.
- Where the Next.js 16 docs live locally (`apps/frontend/node_modules/next/dist/docs/01-app/`)
  and why they override training-data assumptions for this specific Next.js version.

Do not duplicate that content here — this file is a pointer so the conventions are discoverable
as a skill; **apps/frontend/AGENTS.md is the source of truth.** If you update the conventions,
edit that file, not this one.

## Source material

AGENTS.md's vertical-slice rules are distilled from reference material the user provided,
kept verbatim (not summarized) in separate skills:

- `vertical-slice-architecture` — the LinkedIn post/GitLab repo principles, the full
  architecture guide, and the ASCII architecture diagrams.
- `component-organization` — one-directory-per-component pattern (optional, not yet adopted
  here).
- `api-integration-guide` — mocked-service → real-API migration guide (maps to this repo's
  `features/<slice>/data/*.ts` files).
- `project-structure-reference` — the source repo's full directory tree, path aliases, and file
  naming conventions.

When AGENTS.md doesn't explicitly cover a judgment call, check the relevant skill above before
improvising.
