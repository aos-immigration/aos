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
## Cleanup Report - 2024-05-24

### Removed
- `apps/web/src/app/components/intake/useAddressValidation.ts`
- `apps/web/src/app/components/intake/GapExplanationDialog.tsx`
- `apps/web/src/app/lib/gapDetection.ts`
- `apps/web/src/app/lib/__tests__/gapDetection.test.ts`

### Refactored
- Cleaned up obsolete manual validation logic that has been replaced by React Hook Form (RHF) + Zod setup.
- Duplicated components `CurrentAddressForm.tsx` and `PreviousAddressForm.tsx` did not exist.
- Form components `US_STATES` constants and date helpers are already correctly centralized and reused.

### Tests
- Unit: 31 passed
- E2E: Cannot run within sandbox due to Convex login constraints.

### Remaining Issues
- None.
