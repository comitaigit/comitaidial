---
name: component-organization
description: Reference material the user provided on organizing shared/reusable components as one directory per component (Component/{Component.tsx, Component.css, index.ts} with barrel exports), as done by Material-UI, Ant Design, Chakra UI. This pattern is OPTIONAL in this repo — not yet adopted for components/ui/ or feature components/ — consult before deciding whether to nest a component into its own directory (e.g. when it grows sub-components, a co-located hook, or tests/stories).
---

# Component Organization — one directory per component (reference)

This is reference material the user supplied. **It has not been applied to this repo's
`components/ui/` or `features/*/components/` yet** — those still use flat files
(`Card.tsx`, `Button.tsx`, ...). Consult this skill if a component in this project grows enough
files (styles, sub-components, a co-located hook, tests/stories) that flattening starts to hurt,
and confirm with the user before restructuring existing components into this shape.

Note: this repo uses Tailwind utility classes inline (no per-component `.css` files) and keeps
all hooks in the slice's `hooks/` folder per [[nextjs-vertical-slice-conventions]] and
`AGENTS.md`'s "Components are markup-only" rule — so if this pattern is adopted here, adapt it:
drop the `.css` file, and keep any hook in `features/<slice>/hooks/`, not inside the component's
own directory, unless the user says otherwise.

---

## Source: Component Organization — Shared Components

### New Structure

Each shared component now has its own directory containing both the component file and its
styles:

```
src/shared/components/
├── index.ts                  # Barrel export for all components
│
├── Button/
│   ├── Button.tsx           # Button component
│   ├── Button.css           # Button styles
│   └── index.ts             # Barrel export
│
├── Card/
│   ├── Card.tsx             # Card component
│   ├── Card.css             # Card styles
│   └── index.ts             # Barrel export
│
└── Navigation/
    ├── Navigation.tsx       # Navigation component
    ├── Navigation.css       # Navigation styles
    └── index.ts             # Barrel export
```

### Before (Flat Structure)

```
src/shared/components/
├── Button.tsx
├── Button.css
├── Card.tsx
├── Card.css
├── Navigation.tsx
└── Navigation.css
```

### After (Directory Structure)

```
src/shared/components/
├── Button/
│   ├── Button.tsx
│   ├── Button.css
│   └── index.ts
├── Card/
│   ├── Card.tsx
│   ├── Card.css
│   └── index.ts
├── Navigation/
│   ├── Navigation.tsx
│   ├── Navigation.css
│   └── index.ts
└── index.ts
```

### Benefits

**1. Better Organization** — All files related to a component are in one place; easy to find
and manage component files; clear component boundaries.

**2. Scalability** — Easy to add more files to a component (tests, stories, utils); can add
component-specific utilities without cluttering.

**3. Maintainability** — Delete entire component by removing one directory; move components
between projects easily; clear ownership of files.

**4. Clean Imports** — The barrel exports make imports clean:

```ts
// Single component
import { Button } from '@shared/components/Button'

// Multiple components
import { Button, Card, Navigation } from '@shared/components'
```

### Usage Examples

```ts
// Import from Component Directory
import { Button } from '@shared/components/Button'

// Import from Main Barrel
import { Button, Card } from '@shared/components'

// Import Multiple
import { Navigation } from '@shared/components'
```

### Future Component Structure

When adding a new component, follow this pattern:

```
ComponentName/
├── ComponentName.tsx       # Main component
├── ComponentName.css       # Component styles
├── ComponentName.test.tsx  # Unit tests (optional)
├── ComponentName.stories.tsx # Storybook (optional)
├── types.ts               # Component-specific types (optional)
├── utils.ts               # Component helpers (optional)
└── index.ts               # Barrel export
```

### Example: Adding a Modal Component

```
src/shared/components/Modal/
├── Modal.tsx
├── Modal.css
├── ModalHeader.tsx         # Sub-component
├── ModalFooter.tsx         # Sub-component
├── useModal.ts            # Custom hook
├── types.ts               # Modal-specific types
└── index.ts               # Export all public parts
```

`index.ts`:

```ts
export { Modal } from './Modal'
export { ModalHeader } from './ModalHeader'
export { ModalFooter } from './ModalFooter'
export { useModal } from './useModal'
export type { ModalProps, ModalSize } from './types'
```

### Component Directory Template

Create new components using this template:

**Basic Component**

```tsx
// ComponentName.tsx
import { ReactNode } from 'react'
import './ComponentName.css'

interface ComponentNameProps {
  children?: ReactNode
  className?: string
}

export function ComponentName({
  children,
  className = ''
}: ComponentNameProps) {
  return (
    <div className={`component-name ${className}`}>
      {children}
    </div>
  )
}
```

**Index File**

```ts
// index.ts
export { ComponentName } from './ComponentName'
export type { ComponentNameProps } from './ComponentName'
```

### Migration Steps (Already Done, in the source repo)

✅ Created directories for each component
✅ Moved `.tsx` and `.css` files into directories
✅ Created `index.ts` barrel exports
✅ Updated main `shared/components/index.ts`
✅ Verified all imports still work

### Applying to Feature Components (Optional)

You can apply the same pattern to feature components:

**Example: Dashboard Components**

```
src/features/dashboard/components/
├── index.ts
├── DashboardStats/
│   ├── DashboardStats.tsx
│   ├── DashboardStats.css
│   └── index.ts
└── RecentActivity/
    ├── RecentActivity.tsx
    ├── RecentActivity.css
    └── index.ts
```

### Best Practices

**DO ✅**
- Keep related files together in component directory
- Use barrel exports (`index.ts`) for clean imports
- Follow consistent naming (directory = component name)
- Include component-specific types in component directory

**DON'T ❌**
- Mix unrelated components in one directory
- Create deeply nested component structures
- Export internal implementation details
- Duplicate component logic across directories

### Summary

The new structure provides:
- 📁 Better organization - Each component is self-contained
- 🔍 Easy navigation - All component files in one place
- 🚀 Scalability - Easy to add tests, stories, utils
- 🧹 Clean imports - Barrel exports for convenience
- 🎯 Clear ownership - One directory per component

This pattern is industry-standard and used by many popular libraries like Material-UI, Ant
Design, and Chakra UI.
