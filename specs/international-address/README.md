# International Address Support

## Overview
Support international addresses in the intake forms by matching USCIS I-485 form structure with separate fields for US vs international addresses.

## Key Design Decision
USCIS forms have **separate fields**:
- `State` (dropdown) + `ZIP Code` → for US addresses
- `Province` (text/dropdown) + `Postal Code` + `Country` → for non-US addresses

## Spec Index
| File | Description |
|------|-------------|
| `user-stories.md` | User requirements and acceptance criteria |
| `gherkin.feature` | Automated test scenarios |
| `schema.md` | Data types, country lists, validation patterns |

## Countries with Dropdown Regions
| Country | Region Type | Count |
|---------|-------------|-------|
| US | States + Territories | 56 |
| Canada | Provinces + Territories | 13 |
| Mexico | States | 32 |
| All Others | Free-text input | N/A |

## UX Flow
1. User selects country from searchable dropdown
2. If US/CA/MX → State dropdown with known regions
3. If other country → Free-text "State / Province" input
4. Labels update dynamically (State/Province, ZIP/Postal Code)
5. Google Places autocomplete restricted to US/CA/MX
