## Cleanup Report - 2024-02-09

### Removed
- Inline address form duplication in `apps/web/src/app/components/intake/IntakeFlow.tsx`.
- Confirmed removal of `CurrentAddressForm.tsx` and `PreviousAddressForm.tsx` (already absent).

### Refactored
- Extracted `AddressHistoryList` component from `AddressHistory.tsx`.
- Updated `IntakeFlow.tsx` to use `AddressHistoryList` for address history step, ensuring consistency and RHF+Zod usage.
- Refactored `AddressHistory.tsx` to use `AddressHistoryList`.
- Updated `addressSchema.ts` to include conditional ZIP validation (US only) and date range validation.
- Refactored `addressValidation.ts` to use `addressSchema.ts` for field-level validation, removing duplicated logic.

### Tests
- Unit: 41 passed (including new schema tests).
- E2E: Skipped due to environment issues (package manager conflict).

### Remaining Issues
- `validateRequiredFields`, `validateZipCode`, `validateDateRange` in `addressValidation.ts` are deprecated but kept for compatibility.
- E2E tests need environment fix to run locally.
