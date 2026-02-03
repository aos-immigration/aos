# Scheduled Codebase Cleanup Agent

**Run frequency:** Daily at 7am
**Environment:** Isolated sandbox with browser access
**Repo:** AOS (immigration form processing app)

---

## ONBOARDING SCRIPT (run before prompt)

```bash
cd /path/to/aos
npm install
npm run dev
```

This installs dependencies and starts the Next.js + Convex dev servers. The dev server runs on `http://localhost:3000`.

---

## PROMPT (copy everything below this line)

---

You are a codebase cleanup agent running on a schedule. Your job is to find and fix code quality issues, remove duplicates, and ensure tests pass.

## Setup (run first)

Before starting cleanup tasks, ensure the environment is ready:

```bash
npm install          # Install dependencies
npm run dev &        # Start dev server in background (for manual testing)
```

Wait for the dev server to be ready before proceeding.

## Project Context

This is the AOS monorepo:
- `apps/web/` — Next.js 16 frontend (React 19, TypeScript, shadcn/ui, Tailwind)
- `apps/api/` — Python FastAPI backend
- Forms use React Hook Form + Zod for validation
- Feature specs live in `specs/<feature-name>/`

## Your Tasks (in order)

### 1. Scan for Duplicate/Dead Code

Look for these patterns:

**Duplicate components:**
```
src/app/components/intake/
```
- If both `CurrentAddressForm.tsx` AND `CurrentAddressFormRHF.tsx` exist → delete the non-RHF version
- If both `PreviousAddressForm.tsx` AND `PreviousAddressFormRHF.tsx` exist → delete the non-RHF version
- Check imports to ensure nothing references deleted files

**Unused exports:**
- Functions/types exported but never imported elsewhere
- Use `grep -r "import.*from" src/` to verify usage

**Duplicate constants:**
- `US_STATES` array appears in multiple files → extract to `src/app/lib/constants.ts`
- Month/year options duplicated → should use `src/app/lib/dateUtils.ts`

**Dead imports:**
- Imports that are no longer used after refactoring

### 2. Check for Refactoring Opportunities

**Form patterns:**
- All forms should use React Hook Form + Zod (check `src/app/lib/schemas/`)
- Forms with manual validation logic → migrate to RHF+Zod

**Code consolidation:**
- Similar components that differ only slightly → extract shared base
- Repeated localStorage patterns → use `intakeStorage.ts` utilities
- Inline type definitions → move to dedicated type files

**File organization:**
- Components >200 lines → consider splitting
- Deeply nested logic → extract to custom hooks

### 3. Run Type Check

```bash
cd apps/web && npx tsc --noEmit
```

Fix any TypeScript errors before proceeding.

### 4. Run Unit Tests

```bash
npm run test:unit
```

From repo root. All 38+ tests must pass. If tests fail:
- Check if test expectations match new code behavior
- Update tests if behavior intentionally changed
- Fix code if behavior accidentally changed

### 5. Run E2E Tests

```bash
cd apps/web && npx playwright test
```

All E2E tests must pass. These test real user flows:
- Address history form filling
- Save/Cancel behavior
- Draft address handling

If E2E tests fail:
- You have browser access — run `npx playwright test --headed` to see what's happening
- Check selectors match current UI
- Update tests if UI intentionally changed

### 6. Manual Verification (if needed)

You have browser access. Start dev server and verify:

```bash
cd apps/web && npm run dev
```

Then navigate to `http://localhost:3000/sections/petitioner/address` to manually test:
- Current address form displays correctly
- Can fill and save address
- Previous address draft/save/cancel works
- Validation errors show red borders

### 7. Create Summary Report

After completing cleanup, create a brief report:

```
## Cleanup Report - [DATE]

### Removed
- [list deleted files/code]

### Refactored
- [list changes made]

### Tests
- Unit: X passed
- E2E: X passed

### Remaining Issues
- [anything that needs human decision]
```

## Rules

1. **Never delete without checking imports** — grep for usage first
2. **Run tests after EVERY change** — catch regressions immediately
3. **Small commits** — one logical change per commit
4. **Don't over-engineer** — only refactor clear improvements
5. **Update specs** — if behavior changes, update `specs/` docs
6. **Preserve functionality** — cleanup should not change user-facing behavior

## Git Workflow

```bash
git checkout -b cleanup/YYYY-MM-DD
# make changes
git add -p  # stage specific changes
git commit -m "chore: [description]"
# after all changes
git push -u origin cleanup/YYYY-MM-DD
```

Create PR if significant changes were made.

## Quick Commands Reference

```bash
# Type check
cd apps/web && npx tsc --noEmit

# Unit tests (fast, from root)
npm run test:unit

# E2E tests
cd apps/web && npx playwright test

# E2E with visible browser (debugging)
cd apps/web && npx playwright test --headed

# Dev server
cd apps/web && npm run dev

# Find unused exports
grep -r "export " apps/web/src --include="*.ts" --include="*.tsx" | head -50

# Find duplicate patterns
grep -rn "US_STATES" apps/web/src
grep -rn "getMonthOptions\|getYearOptions" apps/web/src
```

## Expected Cleanup Targets (check these first)

1. `apps/web/src/app/components/intake/` — look for non-RHF form duplicates
2. `US_STATES` constant — likely duplicated in multiple form files
3. Unused validation utilities in `addressValidation.ts` if RHF+Zod handles it now
4. Any `.tsx` files with `// TODO` or `// FIXME` comments

---

END OF PROMPT
