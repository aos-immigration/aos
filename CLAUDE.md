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

### Testing (apps/web)
```bash
cd apps/web
npm run test:unit      # Run unit tests (~135ms) - RUN AFTER EVERY CODE CHANGE
npm run test:watch     # Run tests on file change (dev mode)
npm run test:e2e       # Run Playwright browser tests
npm run test:e2e:headed # Run E2E with visible browser (debugging)
```

**Test Structure:**
- `src/app/lib/__tests__/*.test.ts` — Unit tests for validation, dates, gap detection
- `e2e/*.spec.ts` — Browser tests for user flows

**Agent Testing Protocol:**
1. After modifying logic → `npm run test:unit`
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

## Code Patterns

- **Type-first:** Discriminated unions for form field values (MonthValue, RelationshipValue, EmploymentStatus)
- **Factory functions:** `defaultIntakeData()`, `normalizeIntake()` for safe data handling
- **SSR-safe storage:** Always check `typeof window !== 'undefined'` before localStorage access
- **PDF field traversal:** Recursive tree walk through AcroForm parent/child hierarchy with dereferencing
- **Dark mode:** Default enabled, Tailwind `dark:` prefix throughout
