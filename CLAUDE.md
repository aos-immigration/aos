# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AOS is an immigration form processing application with multi-step intake flows and PDF form filling. Monorepo structure with Next.js frontend and Python FastAPI backend.

## Commands

### Web App (apps/web)
```bash
cd apps/web
npm run dev      # Starts Convex + Next.js dev servers concurrently
npm run build    # Production build
npm run lint     # ESLint
```

### Testing (Turborepo)
```bash
# From repo root (recommended) - runs across all packages
npm run test:unit      # Unit tests (~500ms with turbo) - RUN AFTER EVERY CODE CHANGE
npm run test:e2e       # Playwright browser tests

# From apps/web directly
cd apps/web
npm run test:unit      # Unit tests (~135ms)
npm run test:watch     # Watch mode for dev
npm run test:e2e:headed # E2E with visible browser (debugging)
```

**Test Structure:**
- `apps/web/src/app/lib/__tests__/*.test.ts` — Unit tests (validation, dates, gap detection)
- `apps/web/e2e/*.spec.ts` — Browser tests for user flows

**Agent Testing Protocol:**
1. After modifying logic → `npm run test:unit` (from root)
2. After UI changes → `npm run test:e2e`
3. TypeScript check → `npx tsc --noEmit`

### API (apps/api)
```bash
cd apps/api
npm run dev      # uvicorn with hot reload on port 8000
npm run lint     # Python syntax check
```

Uses `uv` for Python package management. API requires Python 3.11+.

## Architecture

### Frontend (apps/web)
- **Framework:** Next.js 16 with App Router, React 19, TypeScript
- **UI:** shadcn/ui components (Radix primitives) + Tailwind CSS
- **State:** localStorage for intake data (`aos:intake:v1` key), Convex for persistent form metadata
- **PDF:** pdf-lib for client-side PDF manipulation

**Route Structure:**
- `/forms/[form-type]/[section]` — Form-specific pages (i-130, i-485)
- `/sections/[person]/[subsection]` — Data collection sections (petitioner/beneficiary with address/employment/biographic)

**Key Components:**
- `IntakeFlow` (`src/app/components/intake/`) — Multi-step form wizard with address/employment history
- `DashboardLayout` + `Sidebar` (`src/components/`) — App shell with collapsible section navigation
- `StepShell`, `Fields` — Reusable form building blocks

**Storage Layer:** `src/app/lib/intakeStorage.ts` — Type-safe localStorage utilities with SSR guards, data normalization, and versioned keys

### Backend (apps/api)
- **Framework:** FastAPI with pikepdf/pypdf for PDF processing
- **Entry:** `app/main.py`

**Key Endpoints:**
- `GET /fields/{slug}` — List PDF form fields
- `POST /fill/{slug}` — Fill PDF with `{fields: Dict[str, str], checkboxes: Dict[str, bool]}`
- `GET /health` — Health check

**PDF Forms:** Stored in `Forms/` directory (3 levels up from main.py)

### Database (Convex)
Schema in `apps/web/convex/schema.ts`:
- `forms` table: slug, title, pdfPath, updatedAt (indexed by slug)
- `listForms` query returns all forms

## Spec-Code Sync Protocol

**CRITICAL: Always keep specs and code in sync.**

Feature specs live in `specs/<feature-name>/` (e.g., `specs/address-history/`).

**When changing code:**
1. Check if specs exist for that feature in `specs/`
2. Verify code changes align with specs
3. If code diverges from spec → update the spec to match
4. If spec has requirements not in code → implement them or discuss with user

**When user reports behavior from manual testing:**
1. Update code to fix the behavior
2. Update specs to document the correct behavior
3. Add/update tests to prevent regression

**Spec structure:**
- `README.md` — Feature overview
- `schema.md` — Data types and structures
- `user-stories.md` — User requirements
- `*.feature` — Gherkin acceptance criteria

**Never forget:** Specs are the source of truth. Code implements specs. Tests verify both.

## Code Patterns

- **Type-first:** Discriminated unions for form field values (MonthValue, RelationshipValue, EmploymentStatus)
- **Factory functions:** `defaultIntakeData()`, `normalizeIntake()` for safe data handling
- **SSR-safe storage:** Always check `typeof window !== 'undefined'` before localStorage access
- **PDF field traversal:** Recursive tree walk through AcroForm parent/child hierarchy with dereferencing
- **Dark mode:** Default enabled, Tailwind `dark:` prefix throughout
