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
## Cleanup Report - 2026-04-14

### Removed
- `apps/web/src/app/components/intake/useAddressValidation.ts` (Dead code, manual validation deprecated in favor of RHF+Zod)

### Refactored
- Verified `US_STATES` constant is correctly imported from `src/app/lib/constants.ts` across forms.
- Verified forms use `getMonthOptions` and `getYearOptions` from `src/app/lib/dateUtils.ts`.
- Address forms are utilizing RHF+Zod (Non-RHF duplicate versions were previously removed).

### Tests
- Unit: 38 passed
- E2E: 3 passed, 2 failed due to expected sandbox limitation with Convex interactive login.

### Remaining Issues
- None at this time. E2E failures are expected in the sandbox.
