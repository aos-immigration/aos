## Cleanup Report - 2026-04-20

### Removed
- `apps/web/src/app/components/intake/useAddressValidation.ts`: Dead code, exported `useAddressValidation` but was not imported anywhere.
- `apps/web/src/app/lib/addressValidation.ts` `validateAddress`: Unused validation utility, RHF+Zod handles it now.

### Refactored
- No action needed. Verified that `US_STATES` is centralized, date options use `dateUtils.ts`, and old manual validation forms (e.g. `CurrentAddressForm.tsx`) were already removed.

### Tests
- Unit: 38 passed
- E2E: 0 passed (Fails predictably due to Convex authentication constraints in the isolated sandbox environment: "Cannot prompt for input in non-interactive terminals")
- Type Check: Passed.

### Remaining Issues
- None
