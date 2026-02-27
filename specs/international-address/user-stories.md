# User Stories: International Address Support

## Story 1: Canadian Address Entry
**As a** user with a Canadian address
**I want to** enter my province and postal code
**So that** my address is validated correctly

**Acceptance Criteria:**
- Province dropdown shows 13 Canadian provinces/territories
- Postal code accepts Canadian format (A1A 1A1)
- Labels show "Province" and "Postal Code"

---

## Story 2: Dynamic Form Labels
**As a** user
**I want to** see form labels change based on my selected country
**So that** the form feels familiar to my region

**Acceptance Criteria:**
- US: "State" + "ZIP Code"
- Canada: "Province" + "Postal Code"
- Mexico: "State" + "Postal Code"
- Others: "State / Province" + "Postal Code"

---

## Story 3: Country Selection
**As a** user
**I want to** select my country from a dropdown
**So that** I can easily select without typing

**Acceptance Criteria:**
- Searchable dropdown with 195+ countries
- Countries sorted alphabetically
- US, Canada, Mexico easily accessible

---

## Story 4: Free-text State Entry
**As a** user with an address outside US/CA/MX
**I want to** type my state/province as free text
**So that** I can enter any valid region name

**Acceptance Criteria:**
- Free-text input replaces dropdown for non-US/CA/MX
- No validation on region name (user knows their address)
- Field accepts any characters

---

## Story 5: Optional Postal Code
**As a** user with an address in a country without postal codes
**I want to** leave the postal code field empty
**So that** I'm not blocked by validation

**Acceptance Criteria:**
- Postal code required only for US/CA/MX
- Other countries: postal code optional
- Empty postal code accepted for countries like Ireland (rural)
