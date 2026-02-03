# Schema: Address History

## Overview

This document defines the data structures for the Address History feature. The actual implementation lives in the codebase, but this serves as the specification.

## Schema Location

**Reference (this file)**: `specs/address-history/schema.md`  
**Implementation**: 
- TypeScript types: `apps/web/src/app/lib/intakeStorage.ts`
- Validation (if using Zod): `apps/web/src/app/lib/addressValidation.ts`
- Database (if using Convex): `apps/web/convex/schema.ts`

## Data Model

### AddressEntry Type

```typescript
export type MonthValue =
  | ""
  | "01" | "02" | "03" | "04" | "05" | "06"
  | "07" | "08" | "09" | "10" | "11" | "12";

/**
 * Address entry for address history collection.
 * Supports both current and previous addresses with optional gap explanations.
 */
export type AddressEntry = {
  /** Unique identifier (UUID v4) */
  id: string;
  
  /** Street address (required) */
  street: string;
  
  /** Unit/apartment number (optional) */
  unit?: string;
  
  /** City (required) */
  city: string;
  
  /** State/province (required) */
  state: string;
  
  /** ZIP/postal code (required) */
  zip: string;
  
  /** Country (required, default: "United States") */
  country: string;
  
  /** Start date - month (required, "01"-"12") */
  startMonth: MonthValue;
  
  /** Start date - year (required, e.g., "2020") */
  startYear: string;
  
  /** Start date - day (optional, for mid-month moves, e.g., "15") */
  startDay?: string;
  
  /** End date - month (optional, null if current address) */
  endMonth?: MonthValue;
  
  /** End date - year (optional, null if current address) */
  endYear?: string;
  
  /** End date - day (optional) */
  endDay?: string;
  
  /** Whether this is the current address (true = no end date) */
  isCurrent: boolean;
  
  /** Explanation for gaps > 30 days (optional but required if gap exists) */
  gapExplanation?: string;
  
  /** Additional notes (optional) */
  notes?: string;
};
```

## Validation Rules

### Required Fields
- street, city, state, zip, country, startMonth, startYear

### Optional Fields
- unit, startDay, endMonth, endYear, endDay, gapExplanation, notes

### Business Rules
1. If `isCurrent: true`, then `endMonth` and `endYear` must be null
2. If `endMonth` and `endYear` exist, `startDate` must be before `endDate`
3. No overlapping address periods
4. If gap > 30 days detected, `gapExplanation` is required
5. ZIP validation: 5 digits for US, flexible for international

## Validation Schema (Zod - if used)

```typescript
import { z } from "zod";

export const addressEntrySchema = z.object({
  id: z.string().uuid(),
  street: z.string().min(1, "Street address is required"),
  unit: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "ZIP code is required"),
  country: z.string().min(1, "Country is required").default("United States"),
  startMonth: z.enum(["", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]),
  startYear: z.string().regex(/^\d{4}$/, "Year must be 4 digits"),
  startDay: z.string().regex(/^(0[1-9]|[12][0-9]|3[01])$/, "Day must be 01-31").optional(),
  endMonth: z.enum(["", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]).optional(),
  endYear: z.string().regex(/^\d{4}$/, "Year must be 4 digits").optional(),
  endDay: z.string().regex(/^(0[1-9]|[12][0-9]|3[01])$/, "Day must be 01-31").optional(),
  isCurrent: z.boolean(),
  gapExplanation: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    if (data.isCurrent) {
      return !data.endMonth && !data.endYear;
    }
    return true;
  },
  { message: "Current address cannot have an end date" }
).refine(
  (data) => {
    if (data.endYear && data.endMonth) {
      const start = new Date(parseInt(data.startYear), parseInt(data.startMonth) - 1);
      const end = new Date(parseInt(data.endYear), parseInt(data.endMonth) - 1);
      return start < end;
    }
    return true;
  },
  { message: "Start date must be before end date" }
);
```

## State Management

### AddressHistoryState (React Component State)

```typescript
export type AddressHistoryState = {
  addresses: AddressEntry[];
  currentEditingId: string | null;
  validationErrors: Record<string, string>;
};
```

## Example Data

### Current Address
```typescript
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  street: "123 Main Street",
  city: "New York",
  state: "NY",
  zip: "10001",
  country: "United States",
  startMonth: "01",
  startYear: "2020",
  startDay: "15",
  isCurrent: true
}
```

### Previous Address
```typescript
{
  id: "660e8400-e29b-41d4-a716-446655440001",
  street: "456 Oak Avenue",
  city: "Los Angeles",
  state: "CA",
  zip: "90001",
  country: "United States",
  startMonth: "03",
  startYear: "2018",
  endMonth: "12",
  endYear: "2019",
  isCurrent: false,
  gapExplanation: "Traveling internationally"
}
```

## Migration Notes

If updating existing `AddressEntry` type:
- Changed `postal` → `zip` (to match Gherkin)
- Changed `fromMonth/fromYear` → `startMonth/startYear` (clearer naming)
- Changed `toMonth/toYear` → `endMonth/endYear` (clearer naming)
- Added `startDay` and `endDay` (optional, for mid-month moves)
- Added `gapExplanation` (new requirement)
