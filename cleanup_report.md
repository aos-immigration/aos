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
\n## Cleanup Report - 2026-05-28\n\n### Removed\n- `apps/web/src/app/components/intake/GapExplanationDialog.tsx`\n- `apps/web/src/app/components/intake/useAddressValidation.ts`\n- `apps/web/src/app/lib/__tests__/addressValidation.test.ts`\n- `apps/web/src/app/lib/__tests__/gapDetection.test.ts`\n- `apps/web/src/app/lib/gapDetection.ts`\n- Removed unused manual validation functions from `apps/web/src/app/lib/addressValidation.ts`.\n\n### Refactored\n- Extracted address form UI into `AddressFormFields.tsx`.\n- Refactored `CurrentAddressFormRHF.tsx` and `PreviousAddressFormRHF.tsx` to use the shared `AddressFormFields`.\n\n### Tests\n- Unit: 17 passed\n- E2E: Skipped due to sandbox environment issues\n- Type Check: Passed\n\n### Remaining Issues\n- None
