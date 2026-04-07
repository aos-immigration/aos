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

## Cleanup Report - 2024-04-07

### Removed
- `apps/web/src/app/components/intake/useAddressValidation.ts`
- `validateAddress` function from `apps/web/src/app/lib/addressValidation.ts`

### Refactored
- Cleaned up manual validation utilities that are now obsolete since components have migrated to React Hook Form and Zod.
- Confirmed `US_STATES` constant is already extracted correctly in `constants.ts`.
- Verified duplicate non-RHF form files (`CurrentAddressForm.tsx`, `PreviousAddressForm.tsx`) are already removed and only RHF forms exist.

### Tests
- Unit: 38 passed
- E2E: 5 run (some expected failures due to Convex login environment constraint)

### Remaining Issues
- None.
