# User Stories: Address History Collection

## Feature Overview
Collect a complete address history for the last 5 years, moving backward in time, for USCIS form requirements.

## User Stories

### Story 1: Add Current Address
As a **user filling out immigration forms**, I want to **add my current address first** so that **I can start with what I know best**.

**Acceptance Criteria:**
- [ ] User can enter street, city, state, zip, country
- [ ] User can enter start date (month/year, day optional)
- [ ] System marks this as "current address" (no end date)
- [ ] Data saves automatically as user types
- [ ] User can see their address displayed after saving

### Story 2: Add Previous Addresses
As a **user**, I want to **add previous addresses in reverse chronological order** so that **I can build my history step by step**.

**Acceptance Criteria:**
- [ ] User can click "Add Previous Address" button
- [ ] System shows a draft form (not saved until explicit Save)
- [ ] System pre-fills end date based on current address start date
- [ ] User can enter address and start date
- [ ] User clicks "Save Address" to validate and save
- [ ] If validation fails, show red borders on invalid fields and block save
- [ ] If validation passes, save address and close form
- [ ] User can click "Cancel" to discard draft without saving
- [ ] Previous addresses display in reverse chronological order

### Story 3: Explain Address Gaps
As a **user with gaps in my address history**, I want to **explain what happened during gaps** so that **I don't feel blocked or judged**.

**Acceptance Criteria:**
- [ ] System detects gaps > 30 days between addresses
- [ ] System prompts gently for explanation
- [ ] User can select from common reasons (unemployed, traveling, student, other)
- [ ] User can provide custom explanation
- [ ] System doesn't block progress, just collects explanation

### Story 4: Edit and Remove Addresses
As a **user**, I want to **edit or remove addresses I've added** so that **I can correct mistakes or change my mind**.

**Acceptance Criteria:**
- [ ] User can click "Edit" on any address card
- [ ] User can modify address fields
- [ ] User can click "Remove" to delete an address
- [ ] System validates all addresses after edit/remove
- [ ] Changes save automatically
