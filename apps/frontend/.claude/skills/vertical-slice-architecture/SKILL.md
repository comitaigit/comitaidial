---
name: vertical-slice-architecture
description: Reference material the user provided on React Vertical Slice Architecture — the LinkedIn post/GitLab repo (sirdawidd/react-vertical-slice) principles, plus the full guide (what it is, layered vs vertical comparison, core principles, feature slice structure, when to use features/ vs shared/ vs app/, best practices, scaling). Load when deciding how to structure a new feature, where a piece of code belongs, or when justifying/explaining this project's vertical-slice choices.
---

# Vertical Slice Architecture — reference material

This is the source material the user supplied (LinkedIn post by Dawid Debinski + the
`react-vertical-slice` GitLab repo's own `ARCHITECTURE.md`-equivalent guide) that
[[nextjs-vertical-slice-conventions]] and this repo's `AGENTS.md` are built on. Kept verbatim
here as reference — **AGENTS.md is still the enforced, project-specific ruleset**; this skill is
the underlying rationale/source to consult when a judgment call comes up that AGENTS.md doesn't
explicitly cover.

Repo: https://gitlab.com/sirdawidd/react-vertical-slice

---

## Source 1 — LinkedIn post (Dawid Debinski, architect, Oct 21 2025)

> I once worked on a React project that turned into a maintenance nightmare. Components
> scattered everywhere, business logic mixed with UI code, and nobody knew where anything
> belonged. Sound familiar? React gives you freedom - too much freedom. Unlike Angular with its
> opinionated structure and clear conventions, React lets you build however you want. That
> flexibility becomes a curse when teams lack architectural guidance. The result? Codebases that
> look like digital junkyards.
>
> ↳ Components doing everything at once
> ↳ Business logic spread across random files
> ↳ Features tangled together like spaghetti
>
> But there's a better way among different types of architecture lets focus on: Vertical Slice
> Architecture. Instead of organizing by technical layers (components, services, utils), you
> organize by features. Each slice contains everything needed for one specific capability -
> components, logic, API calls, types. The benefits are clear: features become self-contained,
> onboarding gets easier, and changes stay isolated. You can delete entire folders without
> breaking other parts.
>
> ```
> src/
> ├── features/
> │   ├── auth/
> │   │   ├── components/
> │   │   ├── hooks/
> │   │   ├── services/
> │   │   └── types/
> │   └── dashboard/
> │       ├── components/
> │       ├── hooks/
> │       └── types/
> └── shared/           # Only truly shared code
> ```
>
> **Benefits**
> ✅ All feature code in one place
> ✅ Easy to add, modify, or remove features
> ✅ Reduced coupling between features
> ✅ Better team collaboration
> ✅ Clear ownership and boundaries
>
> **Core principles**
>
> **1. Feature independence** — Each feature should be as independent as possible:
> - Self-contained with its own components, hooks, and logic.
> - Minimal dependencies on other features.
> - Can be developed, tested, and deployed independently.
>
> Practical guidance:
> - Each feature exports only what is necessary (for example: route objects, feature-level
>   hooks, or a small public API).
> - Prefer local state and hooks inside a feature; use global state only when truly needed.
> - Avoid direct imports from one feature into another. If communication is required, use the
>   mechanisms in Principle 3.
>
> **2. Shared code minimization** — Only truly reusable code goes in `shared/`:
> - Generic UI components (Button, Card, Modal).
> - Common utilities (date formatting, validation).
> - Shared types (User, ApiResponse).
>
> Do not put feature-specific code into `shared/` just because it might be reused later.
> Premature extraction increases coupling and maintenance cost.
>
> When to extract to `shared/`:
> - Two or more features actually reuse the same implementation.
> - The extracted abstraction is stable and well-understood.
> - The extraction reduces duplication without complicating the design.
>
> **3. Feature communication** — When features need to communicate, prefer indirect, decoupled
> mechanisms:
> - Shared state management (Context, Redux, Zustand) — keep slices scoped and well-defined.
> - Emit events through a message bus or pub/sub (custom event emitter, RxJS, or small event
>   library).
> - Share data via URL params, search, or cross-feature route contracts.
>
> Avoid:
> - Direct imports between feature modules (feature A importing feature B internals).
> - Tight coupling that forces simultaneous changes in multiple features.
>
> Example pattern: Each feature can export a `routes.ts` or `featureApi.ts` describing its
> public surface (route paths, eagerly consumed hooks). The app router or a coordinator composes
> these.
>
> **4. Progressive enhancement** — Start simple and evolve:
> - Start with a basic feature structure and local implementations.
> - Add complexity only when required (e.g., introduce a shared state slice or an event bus
>   after two features need it).
> - Extract to `shared/` only when code is reused and stable.
> - Avoid over-engineering early — favor clarity and independence.
>
> Practical checklist:
> - Start with: `ui`, `hooks`, `api`, `domain`, `tests` inside the feature folder.
> - Monitor duplication across features; when duplication hits 2 or more features, consider
>   extraction.
> - Keep public APIs small and explicit.
>
> The downside? It requires discipline and can feel weird initially. Some code duplication might
> occur between slices. But here's the truth: most React apps fail because they prioritize
> technical convenience over business clarity. If you want maintainable React applications, stop
> organizing by file types and start organizing by what your users actually care about.

**Comment thread** — Thierry Prost (verified, 3rd+):

> Great read!
> Vertical Slicing makes a lot of sense on a server, but for a React app it's not my cup of tea:
> - There's almost as many folders as files, thus making things hard to maintain.
> - Everyone needs to be on the same page and most developers will dislike things that are
>   "different" to what they're used to, thus eventually creating more frustration than what it
>   solves.
> If you like opinionated frameworks, you should try out Svelte!

---

## Source 2 — Vertical Slice Architecture Guide (from the repo)

### What is Vertical Slice Architecture?

Vertical Slice Architecture is an approach to organizing code by features (or "slices") rather
than by technical layers. Each slice contains all the code needed to implement a specific
feature, from the UI down to data access.

### Traditional Layered Architecture vs Vertical Slice

**Traditional Layered (Horizontal)**

```
src/
├── components/        # ALL components
├── hooks/            # ALL hooks
├── services/         # ALL API calls
├── types/            # ALL types
└── utils/            # ALL utilities
```

Problems:
- ❌ Hard to find all code related to a feature
- ❌ Changes ripple across multiple layers
- ❌ Difficult to remove features
- ❌ Tight coupling between layers
- ❌ Team conflicts when multiple people work on different features

**Vertical Slice Architecture**

```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   └── dashboard/
│       ├── components/
│       ├── hooks/
│       └── types/
└── shared/           # Only truly shared code
```

Benefits:
- ✅ All feature code in one place
- ✅ Easy to add, modify, or remove features
- ✅ Reduced coupling between features
- ✅ Better team collaboration
- ✅ Clear ownership and boundaries

### Core Principles

**1. Feature Independence** — Each feature should be as independent as possible:
- Self-contained with its own components, hooks, and logic
- Minimal dependencies on other features
- Can be developed, tested, and deployed independently

**2. Shared Code Minimization** — Only truly reusable code goes in `shared/`:
- Generic UI components (Button, Card, Modal)
- Common utilities (date formatting, validation)
- Shared types (User, ApiResponse)
- Not: Feature-specific code that might be reused later

**3. Feature Communication** — When features need to communicate:
- Use shared state management (Context, Redux, Zustand)
- Emit events through a message bus
- Share data through URL params/search
- Avoid: Direct imports between features

**4. Progressive Enhancement** — Start simple and evolve:
- Start with a basic feature structure
- Add complexity only when needed
- Extract to `shared/` when truly reusable
- Don't over-engineer early

### Project Structure Deep Dive

**Feature Slice Structure**

```
feature-name/
├── pages/              # Route components (views)
│   ├── FeaturePage.tsx
│   └── FeaturePage.css
├── components/         # Feature-specific components
│   ├── FeatureWidget.tsx
│   └── FeatureWidget.css
├── hooks/              # Feature-specific hooks
│   └── useFeature.ts
├── services/           # API calls for this feature
│   └── featureApi.ts
├── types/              # Feature-specific types
│   └── index.ts
└── utils/              # Feature-specific utilities
    └── featureHelpers.ts
```

**Example: Auth Feature**

```ts
// features/auth/types/index.ts
export interface LoginCredentials {
  email: string
  password: string
}

// features/auth/hooks/useAuth.ts
export function useAuth() {
  const login = async (credentials: LoginCredentials) => {
    // Login logic
  }
  return { login }
}

// features/auth/pages/LoginPage.tsx
export function LoginPage() {
  const { login } = useAuth()
  // Page component
}
```

### When to Use Each Directory

**`features/` — Feature-Specific Code**

Use when:
- Code is specific to ONE feature
- Unlikely to be reused elsewhere
- Represents a business capability

Examples: `features/auth/hooks/useAuth.ts`, `features/dashboard/components/DashboardStats.tsx`,
`features/checkout/services/paymentApi.ts`

**`shared/` — Cross-Cutting Code**

Use when:
- Code is used by 3+ features
- Generic and not tied to business logic
- Truly reusable components/utilities

Examples: `shared/components/Button.tsx`, `shared/hooks/useDebounce.ts`,
`shared/utils/formatDate.ts`

**`app/` — Application Core**

Use for:
- App configuration (routing, themes)
- Root components (App, Layout)
- Global styles
- App-level providers

### Best Practices

✅ **DO**
- Keep features independent
- Co-locate related files (component + styles + tests)
- Use path aliases for clean imports
- Start with feature-specific code, extract to shared later
- Name features after business capabilities

❌ **DON'T**
- Import from one feature to another
- Put everything in shared prematurely
- Create feature dependencies
- Use generic names like "common" or "misc"
- Over-engineer early

### Adding a New Feature

1. Create feature directory: `mkdir -p src/features/new-feature/{pages,components,hooks,types}`
2. Add feature code: create page components, add feature-specific components, implement hooks
   and services, define types
3. Register routes:
   ```tsx
   // app/App.tsx
   import { NewFeaturePage } from '@features/new-feature/pages/NewFeaturePage'
   <Route path="/new-feature" element={<NewFeaturePage />} />
   ```
4. Add navigation:
   ```tsx
   // shared/components/Navigation.tsx
   <Link to="/new-feature">New Feature</Link>
   ```

### Scaling Considerations

**Small Projects (< 10 features)** — Simple feature folders; minimal shared code; direct
routing in App.tsx.

**Medium Projects (10-50 features)** — Group related features in subfolders; feature modules
with their own routing; more structured shared code; consider feature flags.

**Large Projects (50+ features)** — Micro-frontends consideration; feature teams with ownership;
automated dependency analysis; feature composition patterns.

### Common Questions

**Q: What if two features share a component?**
A: If only 2 features use it, keep it in one feature. If 3+, move to `shared/`.

**Q: Can features communicate?**
A: Yes, through: shared state (Context, Redux), URL parameters, event bus/pub-sub, parent
component orchestration.

**Q: How do I handle authentication across features?**
A: Auth is a feature itself (`features/auth/`). Other features use shared auth context or hooks
from `shared/`.

**Q: What about shared types like User?**
A: Truly shared domain types go in `shared/types/`.

**Q: When should I create a new feature?**
A: When you have a distinct business capability that doesn't fit existing features.

### Resources

- Vertical Slice Architecture (Jimmy Bogard)
- Feature Slices for React
- Organizing React Applications

### Summary

Vertical Slice Architecture helps you:
- 🎯 Focus: All code for a feature in one place
- 🔧 Maintain: Easy to understand and modify
- 👥 Collaborate: Multiple teams work independently
- 🚀 Scale: Add features without increasing complexity
- 🗑️ Delete: Remove features with confidence

Start simple, stay organized, and let your architecture evolve with your needs!

---

## Architecture Diagrams (from the repo's DIAGRAMS.md)

**Project Structure Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    App Layer                          │  │
│  │  • Routing (React Router)                            │  │
│  │  • Layout Components                                 │  │
│  │  • Global Styles                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│         ┌─────────────────┼─────────────────┐              │
│         │                 │                 │              │
│         ▼                 ▼                 ▼              │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐      │
│  │   Auth     │    │ Dashboard  │    │   Profile  │      │
│  │  Feature   │    │  Feature   │    │  Feature   │      │
│  │            │    │            │    │            │      │
│  │ • Pages    │    │ • Pages    │    │ • Pages    │      │
│  │ • Comp.    │    │ • Comp.    │    │ • Comp.    │      │
│  │ • Hooks    │    │ • Hooks    │    │ • Hooks    │      │
│  │ • Types    │    │ • Types    │    │ • Types    │      │
│  └────────────┘    └────────────┘    └────────────┘      │
│         │                 │                 │              │
│         └─────────────────┼─────────────────┘              │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Shared Layer                         │  │
│  │  • UI Components (Button, Card, Navigation)          │  │
│  │  • Hooks (useDebounce, useLocalStorage)             │  │
│  │  • Utils (formatDate, validation)                    │  │
│  │  • Types (User, ApiResponse)                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Feature Slice Architecture**

```
┌─────────────────────────────────────────────────────┐
│              Feature Slice (Vertical)                │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │              Pages Layer                    │    │
│  │  Route components that compose the UI       │    │
│  │  Example: LoginPage, DashboardPage         │    │
│  └────────────────────────────────────────────┘    │
│                       │                              │
│                       ▼                              │
│  ┌────────────────────────────────────────────┐    │
│  │           Components Layer                  │    │
│  │  UI components specific to this feature     │    │
│  │  Example: DashboardStats, ProfileForm      │    │
│  └────────────────────────────────────────────┘    │
│                       │                              │
│                       ▼                              │
│  ┌────────────────────────────────────────────┐    │
│  │             Hooks Layer                     │    │
│  │  Business logic and state management        │    │
│  │  Example: useAuth, useDashboard            │    │
│  └────────────────────────────────────────────┘    │
│                       │                              │
│                       ▼                              │
│  ┌────────────────────────────────────────────┐    │
│  │           Services Layer                    │    │
│  │  API calls and external integrations        │    │
│  │  Example: authApi, dashboardApi            │    │
│  └────────────────────────────────────────────┘    │
│                       │                              │
│                       ▼                              │
│  ┌────────────────────────────────────────────┐    │
│  │             Types Layer                     │    │
│  │  TypeScript interfaces and types            │    │
│  │  Example: LoginCredentials, DashboardData  │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**Data Flow**

```
User Action → Page Component (handles input, renders UI)
  → Feature Components (reusable UI blocks, feature-specific logic)
  → Custom Hooks (business logic, state management, side effects)
  → Services (API calls, data transformation, error handling)
  → Backend API
```

**Feature Communication Patterns**

❌ Bad: Direct Feature Dependencies — Auth imports Dashboard, Auth imports Profile
(tight coupling between features).

✅ Good: Communication via Shared State — Auth and Dashboard and Profile all read/write a
shared Context/Redux store instead of importing each other directly (features remain
independent).

**Component Hierarchy (example app)**

```
App
├── BrowserRouter
│   └── Routes
│       ├── Route: /
│       │   └── Layout
│       │       ├── Navigation
│       │       └── Outlet
│       │           ├── DashboardPage
│       │           │   ├── DashboardStats
│       │           │   │   └── StatCard × 4
│       │           │   └── RecentActivity
│       │           │       └── ActivityItem × N
│       │           └── UserProfilePage
│       │               ├── ProfileHeader
│       │               └── ProfileForm
│       ├── Route: /login → LoginPage
│       └── Route: /register → RegisterPage
```

**Folder Structure Comparison**

Traditional (Horizontal Layers) issues: hard to find all auth-related code; changes affect
multiple directories; difficult to remove features.

Vertical Slice (Feature-Based) benefits: all auth code in one place; easy to find and modify;
simple to remove features.

**Development Workflow**

1. Create feature directory (`mkdir -p features/new-feature/pages`)
2. Define types
3. Create hooks (business logic)
4. Build components (UI)
5. Compose pages
6. Register routes

**Scaling Strategy**

Small App (1-10 features) → simple flat structure, minimal shared code
Medium App (10-50 features) → grouped features, feature modules, more shared utilities
Large App (50+ features) → micro-frontends, feature teams, shared component library, monorepo
