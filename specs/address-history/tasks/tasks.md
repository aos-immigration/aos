# Address History Feature - Task Breakdown

**Status**: Planning Complete  
**Total Tasks**: 18  
**Estimated Parallelization**: 6 tasks can run in parallel after initial setup

---

## Task Dependency Graph

```
TASK-01 (Data Model)
    │
    ├─→ TASK-02 (Storage Functions)
    │       │
    │       ├─→ TASK-03 (Validation Utils)
    │       │       │
    │       │       ├─→ TASK-04 (Gap Detection)
    │       │       │       │
    │       │       │       └─→ TASK-05 (Date Utils)
    │       │       │
    │       │       └─→ TASK-06 (Form Validation)
    │       │
    │       └─→ TASK-07 (Address Form Component)
    │               │
    │               ├─→ TASK-08 (Address Card Component)
    │               │       │
    │               │       └─→ TASK-09 (Edit/Remove Actions)
    │               │
    │               └─→ TASK-10 (Current Address Form)
    │                       │
    │                       └─→ TASK-11 (Previous Address Form)
    │                               │
    │                               └─→ TASK-12 (Gap Explanation Dialog)
    │
    └─→ TASK-13 (Main Address History Component)
            │
            ├─→ TASK-14 (Address List Display)
            │
            ├─→ TASK-15 (Add Previous Address Flow)
            │
            └─→ TASK-16 (Integration with StepShell)
                    │
                    └─→ TASK-17 (Responsive Design)
                            │
                            └─→ TASK-18 (Accessibility & Polish)
```

---

## Task List

### Phase 1: Foundation (Must Complete First)

#### TASK-01: Define AddressEntry Type
**ID**: `TASK-01`  
**Status**: ⏳ Pending  
**Dependencies**: None  
**Complexity**: 🟢 Low (15 min)  
**Agent Assignment**: Any

**Description**:  
Ensure the `AddressEntry` type matches the spec requirements. The type already exists in `intakeStorage.ts` but may need updates to match the spec exactly.

**Files to Modify**:
- `apps/web/src/app/lib/intakeStorage.ts`

**Acceptance Criteria**:
- [ ] `AddressEntry` type includes all required fields from spec:
  - `id: string` (UUID)
  - `street: string`
  - `city: string`
  - `state: string`
  - `zip: string` (note: existing uses `postal`, may need alias)
  - `country: string` (default: "United States")
  - `startMonth: string` (existing uses `fromMonth`)
  - `startYear: string` (existing uses `fromYear`)
  - `startDay?: string` (optional, NEW)
  - `endMonth?: string` (existing uses `toMonth`)
  - `endYear?: string` (existing uses `toYear`)
  - `endDay?: string` (optional, NEW)
  - `gapExplanation?: string` (NEW)
  - `isCurrent: boolean`
- [ ] Type is exported and can be imported
- [ ] TypeScript compiles without errors

**Test Command**:
```bash
cd apps/web && npm run build
```

---

#### TASK-02: Create Address Storage Functions
**ID**: `TASK-02`  
**Status**: ⏳ Pending  
**Dependencies**: TASK-01  
**Complexity**: 🟢 Low (30 min)  
**Agent Assignment**: Any

**Description**:  
Create helper functions to save/load address history from localStorage. Extend existing `intakeStorage.ts` patterns.

**Files to Modify**:
- `apps/web/src/app/lib/intakeStorage.ts`

**Acceptance Criteria**:
- [ ] Function `saveAddressHistory(addresses: AddressEntry[]): void` saves to localStorage
- [ ] Function `loadAddressHistory(): AddressEntry[]` loads from localStorage
- [ ] Function `addAddress(address: AddressEntry): void` adds single address
- [ ] Function `updateAddress(id: string, updates: Partial<AddressEntry>): void` updates address
- [ ] Function `removeAddress(id: string): void` removes address
- [ ] All functions handle localStorage errors gracefully
- [ ] Functions integrate with existing `IntakeData` structure

**Test Command**:
```bash
# Create test file: apps/web/src/app/lib/__tests__/intakeStorage.test.ts
# Test: save/load, add/update/remove operations
```

**Test Cases**:
```typescript
// Example test structure
describe('Address Storage', () => {
  it('saves and loads addresses', () => {
    const addresses = [/* test data */];
    saveAddressHistory(addresses);
    const loaded = loadAddressHistory();
    expect(loaded).toEqual(addresses);
  });
  
  it('handles localStorage errors', () => {
    // Mock localStorage to throw
    // Should not crash
  });
});
```

---

#### TASK-05: Create Date Utility Functions
**ID**: `TASK-05`  
**Status**: ⏳ Pending  
**Dependencies**: TASK-01  
**Complexity**: 🟢 Low (20 min)  
**Agent Assignment**: Any (can run parallel with TASK-02)

**Description**:  
Create utility functions for date calculations, comparisons, and formatting used throughout address history.

**Files to Create**:
- `apps/web/src/app/lib/dateUtils.ts`

**Acceptance Criteria**:
- [ ] `formatDateRange(startMonth, startYear, endMonth?, endYear?): string` 
  - Returns: "Jan 2020 - Dec 2022" or "Jan 2020 - Present"
- [ ] `compareDates(month1, year1, month2, year2): number`
  - Returns: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
- [ ] `isDateInFuture(month, year): boolean`
  - Returns true if date is in the future
- [ ] `getYearOptions(): string[]`
  - Returns array of last 12 years as strings
- [ ] `getMonthOptions(): Array<{value: string, label: string}>`
  - Returns month options matching existing pattern

**Test Command**:
```bash
# Create: apps/web/src/app/lib/__tests__/dateUtils.test.ts
```

**Test Cases**:
```typescript
describe('Date Utils', () => {
  it('formats date range correctly', () => {
    expect(formatDateRange('01', '2020', '12', '2022')).toBe('Jan 2020 - Dec 2022');
    expect(formatDateRange('01', '2020')).toBe('Jan 2020 - Present');
  });
  
  it('compares dates correctly', () => {
    expect(compareDates('01', '2020', '12', '2019')).toBe(1);
    expect(compareDates('01', '2020', '01', '2020')).toBe(0);
  });
  
  it('detects future dates', () => {
    const nextYear = String(new Date().getFullYear() + 1);
    expect(isDateInFuture('01', nextYear)).toBe(true);
  });
});
```

---

### Phase 2: Validation & Logic (Can Run Parallel After Phase 1)

#### TASK-03: Create Validation Utility Functions
**ID**: `TASK-03`  
**Status**: ⏳ Pending  
**Dependencies**: TASK-01, TASK-05  
**Complexity**: 🟡 Medium (45 min)  
**Agent Assignment**: Any

**Description**:  
Create validation functions for address data according to spec rules.

**Files to Create**:
- `apps/web/src/app/lib/addressValidation.ts`

**Acceptance Criteria**:
- [ ] `validateRequiredFields(address: AddressEntry): Record<string, string>`
  - Returns object with field names as keys, error messages as values
  - Validates: street, city, state, zip, country, startMonth, startYear
- [ ] `validateDateRange(address: AddressEntry): string | null`
  - Returns error message if start date is after end date
  - Returns error message if start date is in future
  - Returns null if valid
- [ ] `validateZipCode(zip: string, country: string): string | null`
  - Returns error message if invalid format
  - US: 5 digits
  - Other countries: flexible (agent can research or make reasonable)
- [ ] `validateAllAddresses(addresses: AddressEntry[]): Record<string, string>`
  - Validates entire array, checks for overlaps
  - Returns errors keyed by address ID

**Test Command**:
```bash
# Create: apps/web/src/app/lib/__tests__/addressValidation.test.ts
```

**Test Cases**:
```typescript
describe('Address Validation', () => {
  it('validates required fields', () => {
    const address = { street: '', city: 'NYC', /* ... */ };
    const errors = validateRequiredFields(address);
    expect(errors.street).toBeDefined();
    expect(errors.city).toBeUndefined();
  });
  
  it('validates date ranges', () => {
    const address = { 
      startMonth: '12', startYear: '2020',
      endMonth: '01', endYear: '2020'
    };
    expect(validateDateRange(address)).toBeTruthy();
  });
  
  it('detects overlapping addresses', () => {
    const addresses = [/* overlapping addresses */];
    const errors = validateAllAddresses(addresses);
    expect(Object.keys(errors).length).toBeGreaterThan(0);
  });
});
```

---

#### TASK-04: Create Gap Detection Function
**ID**: `TASK-04`  
**Status**: ⏳ Pending  
**Dependencies**: TASK-01, TASK-05  
**Complexity**: 🟡 Medium (30 min)  
**Agent Assignment**: Any (can run parallel with TASK-03)

**Description**:  
Implement gap detection algorithm from spec. Detects gaps > 30 days between addresses.

**Files to Create**:
- `apps/web/src/app/lib/gapDetection.ts`

**Acceptance Criteria**:
- [ ] `detectGap(newAddress: AddressEntry, previousAddress: AddressEntry): number`
  - Returns number of days between addresses
  - Returns negative if overlap, 0 if adjacent, positive if gap
- [ ] `hasSignificantGap(newAddress: AddressEntry, previousAddress: AddressEntry): boolean`
  - Returns true if gap > 30 days
- [ ] Function handles edge cases:
  - Same month/year (no gap)
  - Adjacent months (no gap)
  - Missing dates gracefully

**Test Command**:
```bash
# Create: apps/web/src/app/lib/__tests__/gapDetection.test.ts
```

**Test Cases**:
```typescript
describe('Gap Detection', () => {
  it('detects 30+ day gaps', () => {
    const prev = { endMonth: '01', endYear: '2020', /* ... */ };
    const next = { startMonth: '03', startYear: '2020', /* ... */ };
    expect(hasSignificantGap(next, prev)).toBe(true);
  });
  
  it('does not flag adjacent addresses', () => {
    const prev = { endMonth: '01', endYear: '2020', /* ... */ };
    const next = { startMonth: '02', startYear: '2020', /* ... */ };
    expect(hasSignificantGap(next, prev)).toBe(false);
  });
});
```

---

#### TASK-06: Create Form Validation Hook
**ID**: `TASK-06`  
**Status**: ⏳ Pending  
**Dependencies**: TASK-03, TASK-04  
**Complexity**: 🟡 Medium (30 min)  
**Agent Assignment**: Any

**Description**:  
Create React hook that manages form validation state and error messages.

**Files to Create**:
- `apps/web/src/app/components/intake/useAddressValidation.ts`

**Acceptance Criteria**:
- [ ] Hook `useAddressValidation(address: AddressEntry, allAddresses: AddressEntry[])`
- [ ] Returns `{ errors: Record<string, string>, isValid: boolean, validate: () => void }`
- [ ] Validates on demand (call `validate()`)
- [ ] Can validate single address or check against all addresses (for overlap detection)
- [ ] Error messages are user-friendly and actionable

**Test Command**:
```bash
# Create: apps/web/src/app/components/intake/__tests__/useAddressValidation.test.tsx
```

---

### Phase 3: UI Components (Can Run Parallel After Phase 2)

#### TASK-07: Create Address Form Component (Base)
**ID**: `TASK-07`  
**Status**: ⏳ Pending  
**Dependencies**: TASK-02, TASK-06  
**Complexity**: 🟡 Medium (1 hour)  
**Agent Assignment**: Frontend-focused agent

**Description**:  
Create reusable address form component with all fields. This is the base form that will be used for both current and previous addresses.

**Files to Create**:
- `apps/web/src/app/components/intake/AddressForm.tsx`

**Acceptance Criteria**:
- [ ] Component accepts props: `address: AddressEntry, onChange: (address: AddressEntry) => void, errors?: Record<string, string>`
- [ ] Renders all fields from spec:
  - Street Address (Input)
  - City (Input)
  - State (Select with US states)
  - ZIP Code (Input)
  - Country (Select, default: "United States")
  - Start Date: Month (Select), Year (Select), Day (Input, optional)
  - End Date: Month (Select, optional), Year (Select, optional), Day (Input, optional)
- [ ] Shows validation errors below fields
- [ ] Uses shadcn/ui components (Input, Select, Label)
- [ ] Handles optional end date (for current address)
- [ ] Auto-saves on blur (calls onChange)

**Test Command**:
```bash
# Manual test: Render component, fill fields, verify onChange called
# Visual test: Check layout matches spec
```

**Visual Check**:
- [ ] Fields are properly labeled
- [ ] Layout matches spec (City/State/ZIP in row on desktop)
- [ ] Error messages appear below invalid fields
- [ ] Responsive (stacks on mobile)

---

#### TASK-08: Create Address Card Component
**ID**: `TASK-08`  
**Status**: ⏳ Pending  
**Dependencies**: TASK-05, TASK-07  
**Complexity**: 🟡 Medium (45 min)  
**Agent Assignment**: Frontend-focused agent (can run parallel with TASK-10)

**Description**:  
Create card component to display address in read-only mode with Edit/Remove buttons.

**Files to Create**:
- `apps/web/src/app/components/intake/AddressCard.tsx`

**Acceptance Criteria**:
- [ ] Component accepts props: `address: AddressEntry, onEdit: () => void, onRemove: () => void`
- [ ] Displays address in format: "Street, City, State ZIP"
- [ ] Displays date range using `formatDateRange()` from TASK-05
- [ ] Shows "Current" badge if `isCurrent: true`
- [ ] Edit button in top-right corner
- [ ] Remove button (× icon) in top-right corner
- [ ] Matches visual spec:
  - White background, gray border, rounded corners
  - Hover effect (shadow, border darkens)
  - Proper spacing and typography

**Test Command**:
```bash
# Manual test: Render with sample address, click Edit/Remove
```

**Visual Check**:
- [ ] Card matches design spec (colors, borders, spacing)
- [ ] Hover state works
- [ ] Buttons are accessible and clickable
- [ ] Date range displays correctly

---

#### TASK-09: Implement Edit/Remove Address Actions
**ID**: `TASK-09`  
**Status**: ⏳ Pending  
**Dependencies**: TASK-02, TASK-08  
**Complexity**: 🟢 Low (30 min)  
**Agent Assignment**: Any

**Description**:  
Implement logic for editing and removing addresses. Integrates with storage functions.

**Files to Modify**:
- `apps/web/src/app/components/intake/AddressHistory.tsx` (will be created in TASK-13)

**Acceptance Criteria**:
- [ ] Clicking "Edit" on AddressCard switches card to edit mode (shows AddressForm)
- [ ] Clicking "Remove" shows confirmation dialog (optional but recommended)
- [ ] Removing address updates localStorage
- [ ] Editing address updates localStorage on save
- [ ] After edit/remove, re-validates all addresses (checks for gaps, overlaps)
- [ ] UI updates immediately (no page refresh needed)

**Test Command**:
```bash
# Manual test: Edit address, verify changes saved
# Manual test: Remove address, verify removed from list
```

---

#### TASK-10: Create Current Address Form Component
**ID**: `TASK-10`  
**Status**: ⏳ Pending  
**Dependencies**: TASK-07  
**Complexity**: 🟢 Low (20 min)  
**Agent Assignment**: Frontend-focused agent (can run parallel with TASK-08)

**Description**:  
Create wrapper component for current address that uses AddressForm but hides end date fields.

**Files to Create**:
- `apps/web/src/app/components/intake/CurrentAddressForm.tsx`

**Acceptance Criteria**:
- [ ] Uses `AddressForm` component
- [ ] Hides end date fields (endMonth, endYear, endDay)
- [ ] Sets `isCurrent: true` automatically
- [ ] Shows label "Current Address"
- [ ] Pre-fills country as "United States"

**Test Command**:
```bash
# Manual test: Render, verify end date fields hidden
```

---

#### TASK-11: Create Previous Address Form Component
**ID**: `TASK-11`  
**Status**: ⏳ Pending  
**Dependencies**: TASK-07, TASK-04  
**Complexity**: 🟡 Medium (45 min)  
**Agent Assignment**: Frontend-focused agent

**Description**:  
Create wrapper for previous addresses that pre-fills end date and triggers gap detection.

**Files to Create**:
- `apps/web/src/app/components/intake/PreviousAddressForm.tsx`

**Acceptance Criteria**:
- [ ] Uses `AddressForm` component
- [ ] Accepts prop `previousAddress: AddressEntry` (the address that comes after this one chronologically)
- [ ] Pre-fills end date based on previous address start date - 1 day
- [ ] Calls gap detection when start date changes
- [ ] Shows gap explanation prompt if gap > 30 days (see TASK-12)
- [ ] Sets `isCurrent: false` automatically

**Test Command**:
```bash
# Manual test: Add previous address, verify end date pre-filled
# Manual test: Create gap > 30 days, verify prompt appears
```

---

#### TASK-12: Create Gap Explanation Dialog
**ID**: `TASK-12`  
**Status**: ⏳ Pending  
**Dependencies**: TASK-04, TASK-11  
**Complexity**: 🟡 Medium (30 min)  
**Agent Assignment**: Frontend-focused agent

**Description**:  
Create dialog/component that prompts user to explain address gaps > 30 days.

**Files to Create**:
- `apps/web/src/app/components/intake/GapExplanationDialog.tsx`

**Acceptance Criteria**:
- [ ] Uses shadcn/ui `Dialog` component
- [ ] Shows message: "We noticed a gap between addresses. Can you explain what happened during this time?"
- [ ] Provides options: "Unemployed", "Traveling", "Student", "Other"
- [ ] If "Other" selected, shows text area
- [ ] Saves explanation to `address.gapExplanation`
- [ ] Validation: Explanation required to continue
- [ ] Can be dismissed (but blocks form submission if gap exists)

**Test Command**:
```bash
# Manual test: Trigger gap, verify dialog appears
# Manual test: Select option, verify saved to address
```

---

### Phase 4: Integration (Requires Previous Phases)

#### TASK-13: Create Main Address History Component
**ID**: `TASK-13`  
**Status**: ⏳ Pending  
**Dependencies**: TASK-10, TASK-11, TASK-08, TASK-09  
**Complexity**: 🔴 High (2 hours)  
**Agent Assignment**: Senior/full-stack agent

**Description**:  
Create main component that orchestrates all address history functionality. This is the main entry point.

**Files to Create**:
- `apps/web/src/app/components/intake/AddressHistory.tsx`

**Acceptance Criteria**:
- [ ] Component manages state: `addresses: AddressEntry[]`
- [ ] Loads addresses from localStorage on mount
- [ ] Displays current address form (if no current address exists)
- [ ] Displays current address card (if current address exists)
- [ ] Shows "Add Previous Address" button
- [ ] Displays list of previous addresses (using AddressCard)
- [ ] Handles adding new previous address
- [ ] Handles editing addresses (switches card to form)
- [ ] Handles removing addresses
- [ ] Auto-saves to localStorage on every change
- [ ] Validates all addresses before allowing continue
- [ ] Shows validation errors

**Test Command**:
```bash
# Manual test: Full flow
# 1. Add current address
# 2. Add previous address
# 3. Edit address
# 4. Remove address
# 5. Verify data persists on refresh
```

**Integration Points**:
- Uses `StepShell` for layout (TASK-16)
- Uses all components from previous tasks
- Integrates with `intakeStorage.ts`

---

#### TASK-14: Create Address List Display Component
**ID**: `TASK-14`  
**Status**: ⏳ Pending  
**Dependencies**: TASK-08, TASK-13  
**Complexity**: 🟢 Low (20 min)  
**Agent Assignment**: Any (can be part of TASK-13)

**Description**:  
Create component that displays list of previous addresses in reverse chronological order.

**Files to Create**:
- `apps/web/src/app/components/intake/AddressList.tsx`

**Acceptance Criteria**:
- [ ] Accepts props: `addresses: AddressEntry[], onEdit: (id: string) => void, onRemove: (id: string) => void`
- [ ] Filters out current address (only shows previous)
- [ ] Sorts by start date (newest first, reverse chronological)
- [ ] Renders AddressCard for each address
- [ ] Shows count: "Previous Addresses (2)"
- [ ] Shows empty state if no previous addresses

**Test Command**:
```bash
# Manual test: Render with multiple addresses, verify order
```

---

#### TASK-15: Implement Add Previous Address Flow
**ID**: `TASK-15`  
**Status**: ⏳ Pending  
**Dependencies**: TASK-11, TASK-12, TASK-13  
**Complexity**: 🟡 Medium (45 min)  
**Agent Assignment**: Any (can be part of TASK-13)

**Description**:  
Implement the flow for adding a previous address, including gap detection and explanation.

**Files to Modify**:
- `apps/web/src/app/components/intake/AddressHistory.tsx`

**Acceptance Criteria**:
- [ ] Clicking "Add Previous Address" shows PreviousAddressForm
- [ ] Form pre-fills end date based on most recent address
- [ ] When user enters start date, checks for gaps
- [ ] If gap > 30 days, shows GapExplanationDialog
- [ ] User must provide explanation to continue
- [ ] On save, adds address to list and saves to localStorage
- [ ] Re-validates all addresses after adding

**Test Command**:
```bash
# Manual test: Add previous address with gap, verify flow works
```

---

#### TASK-16: Integrate with StepShell
**ID**: `TASK-16`  
**Status**: ⏳ Pending  
**Dependencies**: TASK-13  
**Complexity**: 🟢 Low (15 min)  
**Agent Assignment**: Any

**Description**:  
Wrap AddressHistory component in StepShell and add navigation buttons.

**Files to Create/Modify**:
- `apps/web/src/app/sections/beneficiary/address/page.tsx` (or appropriate route)

**Acceptance Criteria**:
- [ ] Uses `StepShell` component with title "Address History"
- [ ] Wraps `AddressHistory` component
- [ ] Shows "Back" button (navigates to previous step)
- [ ] Shows "Continue" button (navigates to next step, disabled if validation fails)
- [ ] Matches layout pattern from `IntakeFlow.tsx`

**Test Command**:
```bash
# Manual test: Navigate to address step, verify layout
```

---

### Phase 5: Polish (Can Run Parallel)

#### TASK-17: Implement Responsive Design
**ID**: `TASK-17`  
**Status**: ⏳ Pending  
**Dependencies**: TASK-16  
**Complexity**: 🟡 Medium (1 hour)  
**Agent Assignment**: Frontend-focused agent

**Description**:  
Ensure all components work well on mobile, tablet, and desktop according to spec.

**Acceptance Criteria**:
- [ ] Desktop (>768px): City/State/ZIP in one row, cards max-width 600px
- [ ] Tablet (480px-768px): City/State in row, ZIP below, cards full-width with constraint
- [ ] Mobile (<480px): All fields stacked, cards full-width, buttons full-width
- [ ] Date fields: Side-by-side on desktop, stacked on mobile
- [ ] All components tested at breakpoints: 320px, 480px, 768px, 1024px

**Test Command**:
```bash
# Manual test: Resize browser, check at each breakpoint
# Use Chrome DevTools device emulation
```

---

#### TASK-18: Accessibility & Visual Polish
**ID**: `TASK-18`  
**Status**: ⏳ Pending  
**Dependencies**: TASK-16  
**Complexity**: 🟡 Medium (1 hour)  
**Agent Assignment**: Frontend-focused agent (can run parallel with TASK-17)

**Description**:  
Implement accessibility features and visual polish from spec.

**Acceptance Criteria**:
- [ ] All inputs have `<Label>` components
- [ ] Error messages use `aria-live` regions
- [ ] Keyboard navigation works (Tab through fields, Enter submits)
- [ ] Focus states visible (2px blue outline)
- [ ] Screen reader announcements for address count
- [ ] Loading states (skeleton loaders when loading from Convex)
- [ ] Success feedback (toast when address saved)
- [ ] Empty state message if no addresses
- [ ] All interactive elements have proper ARIA attributes

**Test Command**:
```bash
# Manual test: Use keyboard only (Tab, Enter, Escape)
# Manual test: Use screen reader (VoiceOver/NVDA)
# Automated: Run a11y tests if available
```

---

## Task Assignment Strategy

### Parallel Execution Opportunities

**After Phase 1 Complete** (TASK-01, TASK-02, TASK-05):
- TASK-03 and TASK-04 can run in parallel
- TASK-07 can start (only needs TASK-02, TASK-06)

**After Phase 2 Complete** (TASK-03, TASK-04, TASK-06):
- TASK-08 and TASK-10 can run in parallel
- TASK-11 can start

**After Phase 3 Complete**:
- TASK-17 and TASK-18 can run in parallel

### Recommended Agent Assignments

**Agent 1 (Backend/Logic)**: TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06  
**Agent 2 (Frontend/UI)**: TASK-07, TASK-08, TASK-10, TASK-11, TASK-12  
**Agent 3 (Integration)**: TASK-13, TASK-14, TASK-15, TASK-16  
**Agent 4 (Polish)**: TASK-17, TASK-18

---

## Testing Strategy

### Unit Tests
- TASK-02: Storage functions
- TASK-03: Validation functions
- TASK-04: Gap detection
- TASK-05: Date utilities

### Component Tests
- TASK-07: AddressForm rendering and interaction
- TASK-08: AddressCard display and actions
- TASK-10, TASK-11: Form wrappers

### Integration Tests
- TASK-13: Full address history flow
- TASK-15: Add previous address with gap detection

### Manual/E2E Tests
- TASK-16: Full step navigation
- TASK-17: Responsive design
- TASK-18: Accessibility

---

## Definition of Done

A task is complete when:
1. ✅ All acceptance criteria are met
2. ✅ Code compiles without errors
3. ✅ Tests pass (if applicable)
4. ✅ Visual check passes (for UI tasks)
5. ✅ Code follows existing patterns (references provided files)
6. ✅ No console errors or warnings

---

## Notes for Worker Agents

- **Reference Existing Code**: Always check `IntakeFlow.tsx` and `StepShell.tsx` for patterns
- **Use shadcn/ui**: All UI components should use existing shadcn/ui components
- **Follow TypeScript**: Use proper types, avoid `any`
- **Auto-save**: All address changes should save to localStorage immediately
- **Error Handling**: Always handle edge cases gracefully
- **Accessibility**: Build with a11y in mind from the start

---

## Progress Tracking

Update task status as you work:
- ⏳ Pending
- 🔄 In Progress
- ✅ Complete
- ❌ Blocked (note why)
