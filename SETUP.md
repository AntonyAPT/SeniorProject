## Development Setup & Guidelines

### Recommended Extensions
- **Tailwind CSS IntelliSense:** For class name autocompletion and linting.

### Organization & Best Practices

When adding new files or features, here are some useful conventions:

#### 1. Component Architecture
- **Server-First:** Default to React Server Components. Only use `'use client'` when interactivity (hooks, event listeners) is strictly necessary.
- **The 150-Line Rule:** If a component exceeds 150 lines, it should be refactored into smaller sub-components.
- **File Placement:**
  - Shared UI components go in `@/components/ui`.
  - Feature-specific components go in `@/components/[feature-name]` or co-located in route group (e.g., `(auth)/components/`).
    - Essentially components should be close relative the file(s) that use them or organized through folders so that they are easy to locate. 

#### 2. Styling Strategy (Hybrid)
- **Tailwind CSS:** Use for layout (flex, grid), spacing (margin, padding), and standard typography.
- **CSS Modules:** Use for establishing a color layout or complex styling and animation

#### 3. State Management & Hooks
- **Hook Extraction:** Extract logic into custom hooks if:
  - It involves complex validation.
  - It uses multiple related `useState`/`useEffect` calls.
  - The logic is reused across components.
- **Location:** Place hooks in a `hooks/` folder near their usage or in a shared `@/hooks` directory.

#### 4. Database & Types
- **Type Safety:** Always use the generated types from `@/types/supabase`.
- **Mutations:** Perform all data writes (Create/Update/Delete) via **Server Actions**, not client-side API calls.