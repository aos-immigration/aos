## Cleanup Report - 2025-02-18

### Removed
- `apps/web/src/app/components/intake/CurrentAddressForm.tsx` (Duplicate of RHF version)
- `apps/web/src/app/components/intake/PreviousAddressForm.tsx` (Duplicate of RHF version)
- `apps/web/src/app/components/intake/AddressForm.tsx` (Unused)

### Refactored
- Extracted `US_STATES` constant to `apps/web/src/app/lib/constants.ts`.
- Updated `CurrentAddressFormRHF.tsx` and `PreviousAddressFormRHF.tsx` to use shared `US_STATES`.
- Refactored `IntakeFlow.tsx` to use `getMonthOptions` and `getYearOptions` from `apps/web/src/app/lib/dateUtils.ts`.

### Tests
- Unit: 38 passed (100%)
- E2E: Skipped due to sandbox environment issues (Convex login/yarn configuration).
- Type Check: Passed.

### Remaining Issues
- `IntakeFlow.tsx` contains duplicated address form logic (`AddressHistoryStep`) which differs from `AddressHistory.tsx`. Future refactoring should consider unifying these.
- E2E tests require a configured environment with Convex access.

---

## Cleanup Report - 2026-04-06

### Removed
- `apps/web/src/app/components/intake/useAddressValidation.ts` (Dead code, replaced by React Hook Form + Zod validation logic).
- `apps/web/src/app/lib/addressValidation.ts` (Removed unused manual validation utilities as forms use RHF+Zod schemas directly now).

### Refactored
- Confirmed forms are using RHF+Zod (e.g. `CurrentAddressFormRHF.tsx`, `PreviousAddressFormRHF.tsx`).
- Confirmed `US_STATES` constant and date utilities are correctly centralized and used from lib modules.

### Tests
- Unit: 38 passed (100%)
- E2E: 0 passed, 2 failed due to restricted sandbox environment (Convex auth).
- Type Check: Passed.

### Remaining Issues
- Tests continue to fail locally without live Convex deployment credentials configured. E2E requires backend bypass or staging variables.
