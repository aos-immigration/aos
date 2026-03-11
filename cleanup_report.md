## Cleanup Report - 2024-05-23

### Removed
- `apps/web/src/app/components/intake/IntakeFlow.tsx` (Unused duplicate of intake logic)
- `apps/web/src/app/components/intake/StepShell.tsx` (Unused)
- `apps/web/src/app/components/intake/GapExplanationDialog.tsx` (Unused)
- `apps/web/src/app/components/intake/Fields.tsx` (Unused)
- `apps/web/src/app/components/intake/useAddressValidation.ts` (Unused)

### Refactored
- Updated `apps/web/src/app/lib/schemas/addressSchema.ts` to allow international ZIP codes (alphanumeric). ZIP code validation regex is now conditional on country being "United States".

### Tests
- Unit: 44 passed (including new tests for address schema).
- E2E: Failed due to environment issues (SWC binary missing, packageManager mismatch).

### Remaining Issues
- E2E tests require environment fixes (installing correct SWC binaries, fixing packageManager configuration).
