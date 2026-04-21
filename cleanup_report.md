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
## Cleanup Report - 2026-04-21

### Removed
- `apps/web/src/app/components/intake/useAddressValidation.ts` (Dead code, manual validation deprecated in favor of RHF+Zod)
- Removed `validateAddress` from `apps/web/src/app/lib/addressValidation.ts` (Unused after `useAddressValidation` removal)

### Refactored
- No major structural refactoring needed this run. `US_STATES` constant is already extracted to `src/app/lib/constants.ts` and used properly in `CurrentAddressFormRHF.tsx`, `PreviousAddressFormRHF.tsx` and `EmploymentHistory.tsx`. Month/year options properly use `dateUtils.ts`. Duplicate components were not found.

### Tests
- Unit: 38 passed
- E2E: Skipped due to expected sandbox errors with Convex client in Playwright tests
- Type Check: Passed

### Remaining Issues
- None
