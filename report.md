## Cleanup Report - 2025-03-01

### Removed
- `apps/web/src/app/components/intake/useAddressValidation.ts` (dead code)
- `validateAddress` from `apps/web/src/app/lib/addressValidation.ts` (dead code)

### Refactored
- Extracted shared address form fields into `apps/web/src/app/components/intake/AddressFormFields.tsx`
- Updated `CurrentAddressFormRHF.tsx` and `PreviousAddressFormRHF.tsx` to use the new `AddressFormFields` component to remove duplicate code.

### Tests
- Unit: 38 passed
- Type Check: Passed successfully
- E2E: Skipped due to environment configuration issues (missing SWC binaries, convex dev auth, yarn vs npm).

### Remaining Issues
- Need to resolve local Playwright execution blockers regarding `convex dev` and Next.js SWC dependencies to run E2E locally.
