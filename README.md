# AOS

A guided intake app for **marriage-based Adjustment of Status**. A user answers
plain-language questions across a few sections; the app stores the answers and
fills the real USCIS PDFs from them.

Not legal advice. Always defer to official USCIS instructions.

---

## Getting it running

```bash
bun install                  # installs web deps + runs `uv sync` for the API

# terminal 1 — Python PDF service on :8000
cd apps/api && npm run dev

# terminal 2 — Convex + Next.js on :3000
cd apps/web && npm run dev
```

`apps/web` needs `NEXT_PUBLIC_CONVEX_URL` in `apps/web/.env.local`. `npm run dev`
runs `convex dev`, which prints the URL and needs you to be logged into Convex.

`NEXT_PUBLIC_API_URL` is optional and defaults to `http://localhost:8000`.

**Without `NEXT_PUBLIC_CONVEX_URL` the production build fails.** `providers.tsx`
drops `ConvexProvider` when the variable is missing, and prerendering
`/forms/i-130/beneficiary` then dies on a `useMutation` call. Any non-empty URL
is enough to get a build through.

### Checks

```bash
npm run test:unit                            # vitest, from the repo root
cd apps/web && ./node_modules/.bin/tsc --noEmit
cd apps/web && npm run lint                  # currently fails, see Known rough edges
cd apps/api && uv run python scripts/eval_fill.py fixtures/   # PDF fill accuracy
```

Use `./node_modules/.bin/tsc`, not `npx tsc` — `npx` misses the local binary here
and downloads an unrelated package called `tsc`.

End-to-end tests (`cd apps/web && npm run test:e2e`) need Playwright browsers
(`npx playwright install chromium`) and a working Convex login, because the
Playwright config boots the app with `npm run dev`.

---

## Layout

```
apps/web/     Next.js 16 App Router, React 19, Tailwind, shadcn/Radix
  src/app/            routes, intake components, lib
  src/components/     app shell (DashboardLayout, Sidebar) + ui primitives
  convex/             database schema, queries, mutations
  e2e/                Playwright specs
apps/api/     FastAPI + pikepdf. One module: app/main.py
Forms/        the USCIS PDF templates (i-130, i-130a, i-131, i-485, i-765)
```

Bun workspaces driven by Turborepo. Root scripts (`dev`, `build`, `test:unit`)
fan out to both apps.

---

## What actually works today

This matters more than the route list, because a good chunk of the UI is
unwired mockups.

**Real, persisted features**

| Route | What it does |
| --- | --- |
| `/sections/petitioner` | Petitioner basics. RHF + Zod, debounced auto-save to Convex |
| `/sections/petitioner/address` | Address history CRUD |
| `/sections/beneficiary/address` | Address history CRUD |
| `/sections/petitioner/employment` | Employment history CRUD |
| "Verify & Preview" button | Builds an I-130 payload and renders the filled PDF |

**Mockups with no data behind them:** `/sections/beneficiary`,
`/sections/beneficiary/employment`, `/sections/beneficiary/biographic`,
`/sections/marital`, `/sections` overview, and everything under `/forms/*`.

**Dead links:** the sidebar points at `/sections/documents` and `/sections/proof`,
neither of which exists.

---

## How data moves

Convex is the store. There is no `localStorage` intake layer — despite the name,
`src/app/lib/intakeStorage.ts` is now just types and factory helpers.

Every page starts by calling `useApplicationId()`
(`src/app/lib/useApplicationId.ts`), which calls the
`getOrCreateApplication` mutation and hands back an `applicationId`. Everything
else is keyed off that id.

**Petitioner basics** auto-saves. You type, React Hook Form validates against
`petitionerBasicsSchema`, and a `watch()` subscription fires on every change: it
writes a draft to `sessionStorage` immediately and calls the
`savePetitionerBasics` mutation on a 500 ms debounce, but only once given name,
family name, citizenship status and relationship are all filled in.

**Addresses and employment** save on submit instead. The form validates with
`currentAddressSchema` / `previousAddressSchema` / `employmentSchema`, then calls
`saveAddress` or `saveEmploymentEntry`. `AddressHistory.tsx` separately runs
`validateAllAddresses()` over the whole list after loading from Convex to catch
overlapping date ranges — that check is hand-written, not Zod.

**PDF preview** lives in `DashboardLayout.tsx`. It reads basics, addresses and
employment out of Convex, prefers the `sessionStorage` draft so unsaved typing
still shows up, runs `buildPdfPayload()` to turn all of it into USCIS field
names, POSTs to `/fill/i-130`, and drops the returned blob into an iframe.

### Convex schema (`apps/web/convex/schema.ts`)

`applications`, `petitionerBasics`, `addresses`, `employmentEntries`, and a
`forms` table. Addresses and employment are indexed by
`[applicationId, personRole]`, so the same tables serve petitioner and
beneficiary. There are no tables yet for marital or biographic data, which is
why those pages are still mockups.

---

## The PDF pipeline

`apps/api/app/main.py` is the whole backend, about 340 lines. Four routes:

| Route | Purpose |
| --- | --- |
| `GET /health` | liveness |
| `GET /fields/{slug}` | list every AcroForm leaf field on a form |
| `GET /debug/field/{slug}?name=` | dump one field's `/AP`, `/V`, `/AS`, parent |
| `POST /fill/{slug}` | fill and stream back the PDF |

A slug maps to `Forms/{slug}.pdf` by filename convention — no registry, so all
five PDFs are reachable even though only `i-130` is wired up in the UI.

`POST /fill/{slug}` takes `{fields: {name: string}, checkboxes: {name: bool}}`
where names are full dotted AcroForm paths like
`form1[0].#subform[0].Pt2Line4a_FamilyName[0]`. Get the exact names from
`GET /fields/i-130` or the catalog at `apps/api/data/i-130.fields.csv`.

### Checkbox handling, the part that will bite you

Checkbox "on" values vary per form and per field. The rules encoded in
`_apply_leaf_value`:

- Fields whose name contains `_Yes[0]` use `/Y`; `_No[0]` uses `/N`. Off is
  always `/Off`. This is an I-130 naming convention and it overrides everything
  below.
- Otherwise `_checkbox_on_value()` sniffs the on-value out of the widget's `/AP`
  appearance dictionary: look at `/D` then `/N`, take the first key that isn't
  `/Off`, fall back to `/Yes`.
- Both `/V` and `/AS` get set, and for radio groups the parent's `/V` is set
  while every sibling's `/AS` is forced to `/Off`.
- `/NeedAppearances` is set to true on the AcroForm root before saving so
  viewers regenerate the visuals.

When a checkbox won't tick, hit `GET /debug/field/i-130?name=...` and read the
`/AP` states. URL-encode the brackets as `%5B` and `%5D`.

### Verifying fill accuracy

`apps/api/scripts/eval_fill.py` fills the PDF, reads every value back out, and
diffs against `expected_values` in the fixtures. It runs the same code path as
the API by default, or against a live server with `--http`. Three i-130 fixtures
in `apps/api/fixtures/`; the other four forms have none.

`apps/api/scripts/extract_fields.py` regenerates the field catalogs in
`apps/api/data/` when a PDF template changes.

---

## Product principles

- Simple, human language. Avoid form jargon.
- Step-by-step over long forms. Start from "current" and walk backward with
  "before that…" prompts.
- Collect five years of address and employment history.
- Month/year by default; day only when the form demands it.
- Make gaps explainable rather than blocking.
- Never claim to be an attorney. Link to USCIS sources.

---

## Known rough edges

- `npm run lint` fails: 12 errors, 21 warnings. Ten are unescaped apostrophes in
  JSX; two are `set-state-in-effect` in `ThemeToggle.tsx`.
- No CI. Nothing checks builds, types or tests on a pull request.
- Employment data is passed into `buildPdfPayload()` and then ignored, so it
  never reaches the PDF.
- Every address is saved with `addressType: "physical"`, so the mailing-address
  branch in `buildPdfPayload()` is unreachable from the UI.
- `EmploymentHistory` hardcodes `personRole: "petitioner"` even though the
  component is otherwise reusable.
- `getOrCreateApplication` returns the first draft application in the whole
  database. There is no auth or per-user scoping yet.
- Sidebar progress percentages and the user name are hardcoded.
- `PdfFillDemo.tsx`, the `listForms` query and the `createApplication` mutation
  have no callers.
- `pypdf` is in the API dependencies but never imported.
