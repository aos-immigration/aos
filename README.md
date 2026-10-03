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

`apps/web` needs `apps/web/.env.local`. Copy `apps/web/.env.example` and fill it
in. `npm run dev` runs `convex dev`, which prints the Convex URL and needs you
to be logged into Convex. The full variable list, including the API secret and
the Convex dashboard setting, is in the root `.env.example`.

`NEXT_PUBLIC_API_URL` is optional. The browser no longer calls the PDF service
directly. Preview posts to the same-origin `/api/fill/i-130` route, and that
route calls the API with `PDF_FILL_SECRET`. Set the same secret on the API
process. `API_URL` overrides where the Next.js server reaches the API
(default `http://localhost:8000`).

**Without `NEXT_PUBLIC_CONVEX_URL` or the Clerk keys, the production build fails.**
`providers.tsx` drops `ConvexProviderWithClerk` when the Convex URL is missing,
and the shared `DashboardLayout` calls `useMutation` (via `useApplicationId()`),
so prerendering `/sections/*` and `/forms/*` dies. `ClerkProvider` also needs
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`. The build stops on
the first of those pages it renders; that is currently `/forms/i-130/petitioner`.

Datadog is wired into both apps. The web app initializes RUM and browser logs
in `apps/web/src/instrumentation-client.ts` with a hardcoded client token, so it
sends data whenever the app runs. The API ships a log line per request from an
HTTP middleware, but only when `DD_API_KEY` is set (`DD_SITE`, `DD_SERVICE` and
`DD_ENV` are optional overrides).

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
(`npx playwright install chromium`), a working Convex login, and Clerk keys in
`apps/web/.env.local`, because the Playwright config boots the app with
`npm run dev` and `/sections` requires a signed-in session.

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

**Dead links:** the sidebar points at `/sections/documents` and `/sections/proof`,
neither of which exists.

---

## How data moves

Convex is the store. There is no `localStorage` intake layer — despite the name,
`src/app/lib/intakeStorage.ts` is now just types and factory helpers.

Every intake page starts by calling `useApplicationId()`
(`src/app/lib/useApplicationId.ts`). After Convex has accepted the Clerk
session, that hook calls `getOrCreateApplication`, which returns the signed-in
user's application (creating one if they don't have one yet). Everything else
is keyed off that id, and every Convex query and mutation checks that the
caller owns it.

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
names, POSTs to `/api/fill/i-130`, and drops the returned blob into an iframe.
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
| `POST /fill/{slug}` | fill and stream back the PDF. Requires header `X-Fill-Secret` matching `PDF_FILL_SECRET`. Missing or wrong secret is 401, including when the variable is unset. |

A slug maps to `Forms/{slug}.pdf` by filename convention — no registry, so all
five PDFs are reachable even though only `i-130` is wired up in the UI.

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

## Accounts

Sign-in is [Clerk](https://clerk.com), wired to Convex with the official
integration (`ClerkProvider`, `ConvexProviderWithClerk`, `convex/auth.config.ts`).
`/sections` and `/forms` require a session, unless the visitor is in the demo.
`/demo` sets a cookie and shows Alex Demo and Jamie Demo, a fake couple with
no SSN and no A-Number. That mode does not write Convex. Signing in clears
the cookie. `/sign-in` and `/sign-up` are the Clerk components. Each Clerk
user gets one application; `ownerId` on that row is the Clerk subject
(`identity.subject`). Reads, writes, and deletes on a record the caller does
not own fail the same way a missing record does. `/account` deletes that
user's rows and then the Clerk user.

Social Security numbers and A-Numbers are encrypted in Convex with AES-256-GCM.
The key is `SENSITIVE_ID_KEY` (32 bytes, base64) on the Convex deployment, with
`SENSITIVE_ID_KEY_VERSION`. Queries return the last four digits only. The
signed-in PDF preview is a Convex action: it decrypts those fields, calls
FastAPI, and returns the PDF bytes. The browser action result does not include
the numbers. To rotate, set `SENSITIVE_ID_KEY_PREVIOUS` and
`SENSITIVE_ID_KEY_PREVIOUS_VERSION` to the old key, point
`SENSITIVE_ID_KEY` at the new key, bump the version, and run
`npx convex run sensitive:reencryptAll`.

The browser does not call the PDF service. A signed-in preview uses the Convex
action. The demo preview uses `/api/fill/[slug]`, which checks the demo cookie
or the Clerk session, strips any SSN-shaped or A-Number-shaped field, and then
calls FastAPI with `PDF_FILL_SECRET`. The secret stays on the server.
Verifying a Clerk JWT inside FastAPI would mean a second auth stack (JWKS,
issuer, authorized parties) for one route. A shared secret plus the session
check is the smaller one that still rejects anonymous callers on both sides.

Multi-factor authentication is configured in the Clerk dashboard (User &
authentication → Multi-factor). Turn on the methods you want there. Also
require email verification, and set the session lifetime to 7 days or less
(the checklist ceiling is 30 days idle). Sign-up uses email, not an SSN.

### Owner setup

1. Create a Clerk application and choose the sign-in methods.
2. In the Clerk dashboard, activate the Convex integration and copy the
   Frontend API URL (`https://<your-instance>.clerk.accounts.dev` in
   development).
3. On the Convex deployment, set `CLERK_JWT_ISSUER_DOMAIN` to that URL with no
   trailing slash: `npx convex env set CLERK_JWT_ISSUER_DOMAIN <url>` from
   `apps/web`, then run `npx convex dev` once so `auth.config.ts` is synced.
4. Copy `apps/web/.env.example` to `apps/web/.env.local` and set
   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`,
   `NEXT_PUBLIC_CONVEX_URL`, and `PDF_FILL_SECRET`.
5. Export the same `PDF_FILL_SECRET` for the API process.
6. Optional: enable MFA in the Clerk dashboard.

### Reset anonymous drafts

Applications saved before accounts existed have no owner. They are dev-only
test data. Convex will refuse the new schema until those documents are gone.
In the Convex dashboard, delete every document in `applications`,
`petitionerBasics`, `addresses`, and `employmentEntries` on the dev
deployment, then run `npx convex dev` again. Nothing in production should be
reading those rows.

`scripts/eval_fill.py --http` sends `X-Fill-Secret` from `PDF_FILL_SECRET`.
Direct mode does not go through the API and does not need the secret.

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
- Anonymous drafts from before accounts cannot be migrated in place. Clear
  them before `npx convex dev` will accept the schema. See Accounts.
- Sidebar progress percentages, the header's "PROGRESS 64%" bar and the user
  name are hardcoded.
- The `listForms` query and the `createApplication` mutation have no callers,
  and nothing populates the `forms` table.
- Unused dependencies: `pdf-lib` in `apps/web`; `pypdf`, `cryptography` and
  `ipykernel` in `apps/api`.
