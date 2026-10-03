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

The click-through for the fictional Sampleton demo is `docs/demo-script.md`.
Without `NEXT_PUBLIC_CONVEX_URL`, run the API and `npx next dev` in
`apps/web`. Answers stay in that browser tab.

**Without `NEXT_PUBLIC_CONVEX_URL` the production build fails.** `providers.tsx`
drops `ConvexProvider` when the variable is missing, and the shared
`DashboardLayout` calls `useMutation` (via `useApplicationId()`), so prerendering
`/sections/*` and `/forms/*` dies. The build stops on the first of those pages
it renders; that is currently `/forms/i-130/petitioner`. Any non-empty URL is
enough to get a build through.

Datadog is wired into both apps. The web app initializes RUM and browser logs
in `apps/web/src/instrumentation-client.ts` with a hardcoded client token, so it
sends data whenever the app runs. Session replay is off
(`sessionReplaySampleRate` 0) and `defaultPrivacyLevel` is `mask`, so a replay
cannot record field text. The API ships one log line per request from HTTP
middleware, and only when `DD_API_KEY` is set. `DD_SITE`, `DD_SERVICE`, and
`DD_ENV` are optional overrides. `POST /fill/{slug}` allows browser calls only
from origins in `ALLOWED_ORIGINS`. When that variable is unset, the only
allowed origin is `http://localhost:3000`. The value `*` is ignored.

### Checks

```bash
bun run setup   # bun install, which also uv-syncs the API
bun run check   # lint, types, unit tests, API tests, PDF fill eval, feature map
```

`bun run check` is what CI runs. It calls `apps/web/node_modules/.bin/tsc`,
not `npx tsc`. `npx` misses the local binary here and downloads an unrelated
package called `tsc`.

Route status and how to verify each screen is `docs/feature-map.md`.
`python3 scripts/feature_map.py --check` fails when a page, API route, or
sidebar href changes without an update to `docs/feature-map.json`.

Agent instructions are `AGENTS.md`.

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

Bun workspaces driven by Turborepo. Root scripts run the matching script in
each app that defines it: `dev` and `lint` exist in both apps, while `build`,
`test:unit` and `test:e2e` only exist in `apps/web`.

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
Nothing links to `/forms/*`; those pages are reachable only by typing the URL.

**Coming soon:** `/sections/documents` and `/sections/proof` are sidebar links.
Each page says the section is not available yet and does not save anything.

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

**PDF preview** lives in `DashboardLayout.tsx`. The header Preview button posts
the canonical intake to `/preview-intake` and shows JPEG page images. It does
not put PDF bytes in the browser. Download my forms (PDF) is inside that
preview and stays disabled until every acknowledgement box is checked, then
posts `/packet` with `acknowledged: true`.
In development the header also shows an "Export Fixture" button. It builds the
payload from the saved Convex records (not the unsaved `sessionStorage` draft),
downloads the wrapped fixture shape `eval_fill.py` accepts (`payload` plus
`expected_values`), and copies `expected_values` from the text fields only.

### Convex schema (`apps/web/convex/schema.ts`)

`applications`, `petitionerBasics`, `addresses`, `employmentEntries`, and a
`forms` table. Addresses and employment are indexed by
`[applicationId, personRole]`, so the same tables serve petitioner and
beneficiary. There are no tables yet for marital or biographic data, which is
why those pages are still mockups.

---

## The PDF pipeline

`apps/api/app/main.py` is the whole backend, about 330 lines. Four routes:

| Route | Purpose |
| --- | --- |
| `GET /health` | liveness |
| `GET /fields/{slug}` | list every AcroForm leaf field on a form |
| `GET /debug/field/{slug}?name=` | dump one field's `/AP`, `/V`, `/AS`, parent |
| `POST /fill/{slug}` | fill and stream back the PDF |

A slug must be one of `i-130`, `i-130a`, `i-131`, `i-485`, or `i-765`. Anything
else is a 404, including a path that would otherwise leave `Forms/`. Only
`i-130` is wired up in the UI.

`POST /fill/{slug}` takes `{fields: {name: string}, checkboxes: {name: bool}}`
where names are full dotted AcroForm paths like
`form1[0].#subform[0].Pt2Line4a_FamilyName[0]`. Get the exact names from
`GET /fields/i-130` or the catalog at `apps/api/data/i-130.fields.csv`.

### Checkbox handling, the part that will bite you

Checkbox "on" values vary per form and per field (`/Y`, `/N`, `/1`, `/Yes`, …).
There is no name-based rule; the `/AP` appearance dictionary is the only source
of truth. On the I-130, every `_Yes[0]` field uses `/Y` and most `_No[0]`
fields use `/N`, but `Pt4Line20_No[0]` and `Pt4Line28_No[0]` use `/Y`. That
comes out of `/AP`, not the field name. The rules in `_apply_leaf_value` and
`_checkbox_on_value()`:

- The on-value is sniffed from the widget's `/AP` (or its parent's `/AP` if the
  widget has none): look at `/D` then `/N`, take the first key that isn't
  `/Off`, fall back to `/Yes`. Off is always `/Off`.
- Both `/V` and `/AS` get set, and for radio groups the parent's `/V` is set
  while every sibling's `/AS` is forced to `/Off`.
- If a `checkboxes` key names a parent field (one with `/Kids`) rather than a
  leaf, `_apply_checkbox_group` sets the parent's `/V` and every kid's `/AS`
  to the first kid's on-value, or to `/Off`.
- `/NeedAppearances` is set to true on the AcroForm root before saving so
  viewers regenerate the visuals.

A `/V` that isn't one of the `/AP` states reads back as set but renders as an
unchecked box in every viewer.

When a checkbox won't tick, hit `GET /debug/field/i-130?name=...` and read the
`/AP` states. URL-encode the brackets as `%5B` and `%5D`.

### Verifying fill accuracy

`apps/api/scripts/eval_fill.py` fills the PDF, reads every value back out, and
diffs against `expected_values` in the fixtures. It runs the same code path as
the API by default, or against a live server with `--http`. Three i-130 fixtures
in `apps/api/fixtures/`; the other four forms have none. For checkboxes it also
asserts the written `/V`/`/AS` is a legal `/AP` appearance state — a value
outside `/AP` reads back "fine" but prints as an unchecked box.

`apps/api/scripts/render_fields.py` is the visual layer: it fills a fixture,
renders the pages with pdfium (form drawing on), and writes one PNG crop per
filled field (plus `--pages` for full pages). An agent or human can eyeball
the crops to confirm values land in the right boxes — no browser needed.

```bash
cd apps/api && uv run python scripts/render_fields.py fixtures/basic_petitioner.json --pages
```

`apps/api/scripts/extract_fields.py` regenerates `apps/api/data/i-130.fields.json`
and `.csv` when the template changes. The I-130 path is hardcoded; there are no
catalogs for the other four forms.

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

- `npm run lint`: 0 errors and 19 warnings after the JSX-entity and
  `set-state-in-effect` fixes (`ThemeToggle.tsx`, `AddressHistory.tsx`);
  12 errors and 20 warnings without those fixes.
- GitHub Actions (`.github/workflows/ci.yml`) runs `bun run setup` and
  `bun run check` on pull requests. That includes web lint, `tsc --noEmit`,
  unit tests, API pytest, pyright, and `eval_fill.py`. Lint warnings do not
  fail the run.
- Employment data is passed into `buildPdfPayload()` and then ignored, so it
  never reaches the PDF.
- Every address is saved with `addressType: "physical"`, so the mailing-address
  branch in `buildPdfPayload()` is unreachable from the UI.
- `EmploymentHistory` hardcodes `personRole: "petitioner"` even though the
  component is otherwise reusable.
- `getOrCreateApplication` returns the first draft application in the whole
  database. There is no auth or per-user scoping yet.
- The `listForms` query and the `createApplication` mutation have no callers,
  and nothing populates the `forms` table.
- Unused dependencies: `pdf-lib` in `apps/web`; `pypdf`, `cryptography` and
  `ipykernel` in `apps/api`.
