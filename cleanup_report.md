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
## Cleanup Report - 2026-05-25

### Removed
- `apps/web/src/app/components/intake/GapExplanationDialog.tsx` (Deprecated unused code)
- `apps/web/src/app/components/intake/useAddressValidation.ts` (Deprecated unused manual validation code)

### Refactored
- None (Verified code is already using extracted shared types and constants correctly based on recent checks).

### Tests
- Unit: 38 passed (100%)
- E2E: Skipped due to sandbox environment issues (Convex login).
- Type Check: Passed.

### Remaining Issues
- None.
