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
- Type Check: Passed.
- E2E: Failed to run. The sandbox environment lacks compatible native binaries for `lightningcss` and `@tailwindcss/oxide` (linux-x64-gnu), causing the Next.js dev server to crash with 500 errors during CSS processing. Attempts to manually install/patch binaries were unsuccessful.

### Remaining Issues
- `IntakeFlow.tsx` duplication of address logic remains.
- Development environment needs configuration to support native dependencies for Tailwind v4/LightningCSS.
