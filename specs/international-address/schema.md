# Schema: International Address Support

## Country Configuration

### Countries with Known Regions
```typescript
type CountryWithRegions = "US" | "CA" | "MX";
```

### Country Labels
| Country | State Label | Postal Label | Postal Required |
|---------|-------------|--------------|-----------------|
| US | State | ZIP Code | Yes |
| CA | Province | Postal Code | Yes |
| MX | State | Postal Code | Yes |
| default | State / Province | Postal Code | No |

## Postal Code Patterns

| Country | Pattern | Examples |
|---------|---------|----------|
| US | `^\d{5}(-\d{4})?$` | 95112, 95112-1234 |
| CA | `^[A-Z]\d[A-Z] ?\d[A-Z]\d$` | M9C 3K6, M9C3K6 |
| MX | `^\d{5}$` | 06600 |
| default | `.*` (any) | 400001, SW1A 1AA, empty |

## Region Lists

### US States + Territories (56)
```
AL, AK, AZ, AR, CA, CO, CT, DE, FL, GA,
HI, ID, IL, IN, IA, KS, KY, LA, ME, MD,
MA, MI, MN, MS, MO, MT, NE, NV, NH, NJ,
NM, NY, NC, ND, OH, OK, OR, PA, RI, SC,
SD, TN, TX, UT, VT, VA, WA, WV, WI, WY,
DC, PR, VI, GU, AS, MP
```

### Canadian Provinces + Territories (13)
```
AB (Alberta), BC (British Columbia), MB (Manitoba),
NB (New Brunswick), NL (Newfoundland and Labrador),
NS (Nova Scotia), NT (Northwest Territories), NU (Nunavut),
ON (Ontario), PE (Prince Edward Island), QC (Quebec),
SK (Saskatchewan), YT (Yukon)
```

### Mexican States (32)
```
AGU, BCN, BCS, CAM, CHP, CHH, COA, COL, CDMX, DUR,
GUA, GRO, HID, JAL, MEX, MIC, MOR, NAY, NLE, OAX,
PUE, QUE, ROO, SLP, SIN, SON, TAB, TAM, TLA, VER,
YUC, ZAC
```

## Address Entry Interface

```typescript
interface AddressEntry {
  street: string;
  unit?: string;
  city: string;
  state: string;        // Dropdown or free-text based on country
  zip: string;          // Postal code (optional for non-US/CA/MX)
  country: string;      // Country name (not code)
  // ... date fields
}
```

## Helper Functions

```typescript
function hasKnownRegions(countryCode: string): boolean;
function getRegionsForCountry(countryCode: string): string[];
function getLabelsForCountry(countryCode: string): { stateLabel: string; postalLabel: string };
function getPostalPattern(countryCode: string): RegExp;
function isPostalRequired(countryCode: string): boolean;
function getCountryCode(countryName: string): string | undefined;
```
