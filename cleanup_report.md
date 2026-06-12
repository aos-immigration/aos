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
## Cleanup Report - 2026-06-12

### Removed
- `apps/web/src/app/components/intake/GapExplanationDialog.tsx` (Unused)
- `apps/web/src/app/components/intake/useAddressValidation.ts` (Unused)
- `apps/web/src/app/lib/gapDetection.ts` (Unused since useAddressValidation was unused)
- `apps/web/src/app/lib/__tests__/gapDetection.test.ts`

### Refactored
- N/A. The non-RHF form duplicates (CurrentAddressForm and PreviousAddressForm) were already removed in a previous iteration. Constants `US_STATES` and date utilities were also already deduplicated appropriately.

### Tests
- Unit: 31 passed
- E2E: 5 passed (Tests pass without playwright interactive runner, earlier playwright run failure was flaky locally but passed on rerun)

### Remaining Issues
- None.
