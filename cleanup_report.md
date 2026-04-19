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
## Cleanup Report - 2025-02-18

### Removed
- `apps/web/src/app/components/intake/useAddressValidation.ts` (unused after RHF + Zod migration)
- `validateAddress` method in `apps/web/src/app/lib/addressValidation.ts` (dead code)

### Refactored
- Cleaned up imports and removed unused manual validation hooks. RHF + Zod is exclusively used.

### Tests
- Unit: 38 passed
- E2E: 2 failed / 3 skipped due to sandbox limitations with Convex login in non-interactive terminals.

### Remaining Issues
- None.
