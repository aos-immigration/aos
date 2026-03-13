## Cleanup Report - 2023-10-27

### Removed
- `apps/web/src/app/components/intake/useAddressValidation.ts` (dead code, no imports detected)

### Refactored
- Validated `US_STATES`, `getMonthOptions`, and `getYearOptions` usage. Found them correctly centralized in `src/app/lib/constants.ts` and `src/app/lib/dateUtils.ts` respectively, minimizing duplicates.
- Validated that `CurrentAddressForm.tsx` and `PreviousAddressForm.tsx` were already deleted in favor of the RHF variants (`CurrentAddressFormRHF.tsx`, `PreviousAddressFormRHF.tsx`).

### Tests
- Unit: 38 passed
- E2E: Skipped (browser/deps missing in sandbox; tests are blocked, per environment constraints).

### Remaining Issues
- None.
