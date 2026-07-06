## Cleanup Report - 2025-02-18

### Removed
- `apps/web/src/app/components/intake/CurrentAddressForm.tsx` (Duplicate of RHF version)
- `apps/web/src/app/components/intake/PreviousAddressForm.tsx` (Duplicate of RHF version)
- `apps/web/src/app/components/intake/AddressForm.tsx` (Unused)
- `apps/web/src/app/components/intake/useAddressValidation.ts` (deprecated manual validation utility)
- `apps/web/src/app/components/intake/GapExplanationDialog.tsx` (deprecated gap explanation dialog UI component)
- `apps/web/src/app/lib/gapDetection.ts` (deprecated gap detection utilities)
- `apps/web/src/app/lib/__tests__/gapDetection.test.ts` (tests for deprecated gap detection utilities)

### Refactored
- Extracted `US_STATES` constant to `apps/web/src/app/lib/constants.ts`.
- Updated `CurrentAddressFormRHF.tsx` and `PreviousAddressFormRHF.tsx` to use shared `US_STATES`.
- Refactored `IntakeFlow.tsx` to use `getMonthOptions` and `getYearOptions` from `apps/web/src/app/lib/dateUtils.ts`.
- Cleaned up duplicated and dead code. Checked components directory and there are no other duplicate forms (only RHF versions remain).

### Tests
- Unit: 31 passed
- E2E: 5 passed
- Type Check: Passed.

### Remaining Issues
- `IntakeFlow.tsx` contains duplicated address form logic (`AddressHistoryStep`) which differs from `AddressHistory.tsx`. Future refactoring should consider unifying these.
