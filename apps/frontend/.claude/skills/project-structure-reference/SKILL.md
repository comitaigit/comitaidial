---
name: project-structure-reference
description: Reference material the user provided — the react-vertical-slice source repo's full directory tree, feature slice pattern, path alias conventions, file naming conventions, and key principles. Load when you need the canonical example of a vertical-slice React project laid out file-by-file, or when deciding naming/path-alias conventions for a new slice.
---

# Project Structure (reference material)

This is the full directory tree and conventions from the `react-vertical-slice` source repo the
user supplied (https://gitlab.com/sirdawidd/react-vertical-slice). It's a Vite + React Router
project, not this repo's Next.js App Router setup — see [[nextjs-vertical-slice-conventions]] and
`AGENTS.md` for how the same principles map onto this project (`app/` route segments instead of
`App.tsx`/`Route`, `data/` instead of `services/`, hooks mandatory for all component logic, etc).
Consult this skill for the canonical shape of a vertical-slice project when a naming or layout
question isn't already answered by `AGENTS.md`.

---

## Source: Project Structure

This document provides a detailed overview of the React Vertical Slice Architecture project
structure.

### Directory Tree

```
react-vertical-slice/
│
├── public/                          # Static assets
│   └── vite.svg                     # Vite logo
│
├── src/                             # Source code
│   │
│   ├── app/                         # Application core
│   │   ├── styles/
│   │   │   └── index.css           # Global styles
│   │   ├── App.tsx                 # Root component with routing
│   │   └── Layout.tsx              # Main layout wrapper
│   │
│   ├── features/                   # Feature slices (Vertical Slices)
│   │   │
│   │   ├── auth/                   # Authentication feature
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts     # Auth hook
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── LoginPage.css
│   │   │   │   └── RegisterPage.tsx
│   │   │   └── types/
│   │   │       └── index.ts        # Auth types
│   │   │
│   │   ├── dashboard/              # Dashboard feature
│   │   │   ├── components/
│   │   │   │   ├── DashboardStats.tsx
│   │   │   │   ├── DashboardStats.css
│   │   │   │   ├── RecentActivity.tsx
│   │   │   │   └── RecentActivity.css
│   │   │   └── pages/
│   │   │       ├── DashboardPage.tsx
│   │   │       └── DashboardPage.css
│   │   │
│   │   └── user-profile/           # User profile feature
│   │       ├── components/
│   │       │   ├── ProfileForm.tsx
│   │       │   ├── ProfileForm.css
│   │       │   ├── ProfileHeader.tsx
│   │       │   └── ProfileHeader.css
│   │       └── pages/
│   │           ├── UserProfilePage.tsx
│   │           └── UserProfilePage.css
│   │
│   ├── shared/                     # Shared code across features
│   │   └── components/
│   │       ├── Button.tsx
│   │       ├── Button.css
│   │       ├── Card.tsx
│   │       ├── Card.css
│   │       ├── Navigation.tsx
│   │       └── Navigation.css
│   │
│   └── main.tsx                    # Application entry point
│
├── .eslintrc.cjs                   # ESLint configuration
├── .gitignore                      # Git ignore rules
├── index.html                      # HTML template
├── package.json                    # Dependencies and scripts
├── README.md                       # Project documentation
├── tsconfig.json                   # TypeScript configuration
├── tsconfig.node.json              # TypeScript config for Node
└── vite.config.ts                  # Vite configuration
```

### Feature Slice Pattern

Each feature follows a consistent structure:

```
feature-name/
├── components/       # UI components specific to this feature
├── hooks/            # Custom hooks for feature logic
├── pages/            # Route components
├── types/            # TypeScript types/interfaces
├── services/         # API calls (when needed)
└── utils/            # Feature-specific utilities (when needed)
```

### Import Paths

The project uses TypeScript path aliases for cleaner imports:
- `@/*` → `./src/*`
- `@features/*` → `./src/features/*`
- `@shared/*` → `./src/shared/*`
- `@app/*` → `./src/app/*`

Example:

```ts
import { Button } from '@shared/components/Button'
import { LoginPage } from '@features/auth/pages/LoginPage'
```

*(This repo uses `@/*` → `./src/*` only, per `tsconfig.json` — e.g.
`@/features/dialer/components/DialerStage`, `@/components/ui/Card` — since Next.js's App Router
makes `app/` the routing layer rather than a `pages/` folder per feature.)*

### File Naming Conventions

- **Components**: PascalCase (e.g., `LoginPage.tsx`, `DashboardStats.tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useAuth.ts`)
- **Types**: PascalCase for interfaces/types (e.g., `AuthUser`, `LoginCredentials`)
- **Styles**: Match component name (e.g., `LoginPage.css`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)

### Key Principles

1. **Feature Independence**: Each feature is self-contained
2. **Minimal Coupling**: Features don't directly depend on each other
3. **Shared Code**: Common UI and utilities in the `shared/` directory
4. **Co-location**: Related files (component + styles + tests) live together
5. **Clear Boundaries**: Easy to identify what belongs to which feature
