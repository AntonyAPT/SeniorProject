---
name: Refactor PortfoliosPage
overview: Break the 368-line PortfoliosPage.tsx into a custom hook (usePortfolioActions) and 3 sub-components (PortfolioItem, CreatePortfolioModal, DeleteConfirmModal), bringing the main file down to ~100 lines while preserving all existing behavior and naming conventions.
todos:
  - id: hook
    content: Create usePortfolioActions hook in portfolios/hooks/usePortfolioActions.ts
    status: completed
  - id: portfolio-item
    content: Create PortfolioItem component in portfolios/components/PortfolioItem.tsx
    status: completed
  - id: create-modal
    content: Create CreatePortfolioModal component in portfolios/components/CreatePortfolioModal.tsx
    status: completed
  - id: delete-modal
    content: Create DeleteConfirmModal component in portfolios/components/DeleteConfirmModal.tsx
    status: completed
  - id: slim-page
    content: Refactor PortfoliosPage.tsx to use the new hook and components (~100 lines)
    status: completed
  - id: verify
    content: Check for linter errors and verify all imports resolve correctly
    status: completed
isProject: false
---

# Refactor PortfoliosPage.tsx

## File Structure After Refactoring

```
portfolios/
  page.tsx                              (unchanged - server component)
  PortfoliosPage.tsx                    (368 -> ~100 lines - orchestrator)
  portfolios.module.css                 (unchanged)
  hooks/
    usePortfolioActions.ts              (NEW - ~75 lines)
  components/
    PortfolioItem.tsx                   (NEW - ~90 lines)
    CreatePortfolioModal.tsx            (NEW - ~55 lines)
    DeleteConfirmModal.tsx              (NEW - ~40 lines)
```

## 1. Extract `usePortfolioActions` hook

**File**: [`portfolios/hooks/usePortfolioActions.ts`]

Owns all CRUD-related state and handlers currently in `PortfoliosPage`:

- **State moved in**: `error`, `isSubmitting`, `isCreating`, `createName`, `renamingId`, `renameValue`, `deletingPortfolio`
- **Handlers moved in**: `handleCreate`, `handleRename`, `handleDelete`, `startRenaming`, `cancelRenaming`
- **Parameters**: receives `portfolios`, `activePortfolioId`, `setSelectedPortfolioId` (needed by `handleDelete` for fallback selection when deleting the active portfolio)
- **Returns**: object with all state values + handler functions
- Calls the existing server actions from `[actions/portfolio.ts](finance-dashboard/app/(main)`/actions/portfolio.ts) -- no changes to those

## 2. Extract `PortfolioItem` component

**File**: [`portfolios/components/PortfolioItem.tsx`]

Extracted from the `portfolios.map(...)` block (current lines 171-276). Renders a single portfolio card with two modes:

- **Display mode**: portfolio icon, name, badges (Selected / Default), total value, rename + delete action buttons
- **Rename mode**: inline form with text input, confirm/cancel buttons

Props: `portfolio`, `isSelected`, `isRenaming`, `renameValue`, `isSubmitting`, `onSelect`, `onRenameValueChange`, `onRenameSubmit`, `onRenameCancel`, `onStartRenaming`, `onStartDeleting`

Also contains the `formatCurrency` helper (only consumer).

## 3. Extract `CreatePortfolioModal` component

**File**: [`portfolios/components/CreatePortfolioModal.tsx`]

Extracted from lines 294-334. The overlay modal for creating a new portfolio.

Props: `createName`, `isSubmitting`, `onCreateNameChange`, `onCreate`, `onClose`

## 4. Extract `DeleteConfirmModal` component

**File**: [`portfolios/components/DeleteConfirmModal.tsx`]

Extracted from lines 337-363. The overlay confirmation dialog.

Props: `portfolioName`, `isSubmitting`, `onConfirm`, `onClose`

## 5. Slim down `PortfoliosPage.tsx`

**File**: `[PortfoliosPage.tsx](finance-dashboard/app/(main)`/portfolios/PortfoliosPage.tsx)

What remains (~100 lines):

- Calls `usePortfolioActions` hook and `useSelectedPortfolio` context
- Keeps the portfolio selection `useEffect` + `activePortfolioId` / `defaultPortfolioId` derivation (page-level selection concern, not CRUD)
- Keeps `handleSelectPortfolio` (selection concern)
- Renders: header section, error banners, list of `PortfolioItem` components, create button, `CreatePortfolioModal`, `DeleteConfirmModal`

## What Does NOT Change

- `[page.tsx](finance-dashboard/app/(main)`/portfolios/page.tsx) -- server component, data fetching, types
- `[portfolios.module.css](finance-dashboard/app/(main)`/portfolios/portfolios.module.css) -- all CSS stays as-is, imported by sub-components as needed
- `[actions/portfolio.ts](finance-dashboard/app/(main)`/actions/portfolio.ts) -- server actions
- `[SelectedPortfolioContext.tsx](finance-dashboard/app/(main)`/contexts/SelectedPortfolioContext.tsx) -- context provider
- All naming conventions (variable names, CSS class names, function names)
- All existing behavior and UX

