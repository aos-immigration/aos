# AGENTS.md

Operating instructions for Cursor agents in this repository. Product behavior
and the PDF pipeline are described in `README.md`. Route status is
`docs/feature-map.md`. Recurring mistakes are `docs/agent-patterns.md`.

## Start here

Every non-trivial task starts by reading `.cursor/skills/poteto-mode/SKILL.md`
and following it. That file is `/poteto-mode`. Spawn sub-workers as
`poteto-agent` (`.cursor/agents/poteto-agent.md`). Do not substitute
`generalPurpose` for that role.

Before finishing, read `.cursor/skills/review-lessons/SKILL.md` and check the
diff against `docs/agent-patterns.md`.

Verify a screen from `docs/feature-map.md` before treating it as real. The
map is generated from `docs/feature-map.json`. `bun run check` fails when a
page, FastAPI route, or sidebar href changes without a matching entry.

## Setup and check

`bun` 1.3.10 and `uv` must be on `PATH`.

```bash
bun run setup   # bun install, which uv-syncs apps/api
bun run check   # the command CI runs
```

`bun run check` runs, and fails on the first group that fails:

- web eslint (errors fail the run, warnings do not)
- `apps/web/node_modules/.bin/tsc --noEmit`
- `turbo run test:unit`
- `apps/api` pytest, pyright, and `scripts/eval_fill.py fixtures/`
- the pstack discovery check
- `python3 scripts/feature_map.py --check`

Use that local `tsc`. `npx tsc` misses the binary and installs an unrelated
package named `tsc`.

Dev servers, in two terminals:

```bash
cd apps/api && npm run dev    # FastAPI on :8000
cd apps/web && npm run dev    # Convex + Next.js on :3000
```

`apps/web/.env.local` needs `NEXT_PUBLIC_CONVEX_URL`. `npm run dev` runs
`convex dev`, which prints the URL and requires a Convex login.
`NEXT_PUBLIC_API_URL` is optional and defaults to `http://localhost:8000`.

A production build without `NEXT_PUBLIC_CONVEX_URL` fails while prerendering
`/forms/i-130/petitioner`. Any non-empty URL is enough for `next build`.

End-to-end tests (`cd apps/web && npm run test:e2e`) need Playwright
(`npx playwright install chromium`) and a Convex login. They are not part of
`bun run check`.

After a PDF mapping change, render crops and look at them:

```bash
cd apps/api && uv run python scripts/render_fields.py fixtures/basic_petitioner.json --pages
```

## Layout and boundaries

```
apps/web/          Next.js App Router, React 19, Tailwind, shadcn/Radix
  src/app/         routes, intake UI, Zod schemas, PDF payload builder
  src/components/  shell (DashboardLayout, Sidebar) and ui primitives
  convex/          schema, queries, mutations
  e2e/             Playwright
apps/api/          FastAPI + pikepdf. HTTP entry is app/main.py
  scripts/         eval_fill.py, render_fields.py, extract_fields.py
  fixtures/        i-130 fill fixtures
Forms/             USCIS PDF templates, opened by slug
docs/              feature map, agent patterns, review process
.cursor/skills/    project skills, including vendored pstack
.cursor/agents/    poteto-agent
```

`apps/web` owns the UI and the Convex client. It does not fill PDFs.
`apps/web/convex` owns persistence. `apps/api` fills PDFs and does not store
intake answers. `Forms/{slug}.pdf` is the template for `POST /fill/{slug}`. The slug allowlist
is `i-130`, `i-130a`, `i-131`, `i-485`, and `i-765`. Only `i-130` is wired in
the UI. Browser calls are limited to `ALLOWED_ORIGINS`, which defaults to
`http://localhost:3000` when unset.

Bun workspaces, Turborepo. Root `dev` and `lint` exist in both apps. `build`,
`test:unit`, and `test:e2e` exist only in `apps/web`.

## What is real

Convex is the intake store. `src/app/lib/intakeStorage.ts` is types and
factory helpers. `sessionStorage` holds the PDF preview draft.
`localStorage` holds the theme.

`useApplicationId()` calls `getOrCreateApplication` and returns the first
draft application in the database. There is no auth.

Route status is `docs/feature-map.md`. Petitioner basics, both address
histories, and `POST /fill/{slug}` persist. Petitioner employment persists
but does not reach the PDF. Beneficiary basics, beneficiary employment,
biographic, marital history, and everything under `/forms` are static
mockups. The header counts sections that have stored data. It does not show
a percentage. Mock sections say they are not saved yet.
`/sections/documents` and `/sections/proof` are coming-soon pages inside
the shell.

Datadog RUM in the web app uses a hardcoded client token in
`apps/web/src/instrumentation-client.ts`. Session replay is off and text is
masked. The API logs one line per request only when `DD_API_KEY` is set.

## Conventions

- Forms use React Hook Form and a Zod resolver. Schemas live in
  `apps/web/src/app/lib/schemas/`. Do not hand-roll field validation.
- Constrained values are string-literal unions or `z.enum` lists.
  `MonthValue` is in `intakeStorage.ts`. Relationship, citizenship status,
  and employment status are Zod enums.
- Guard browser APIs with `typeof window !== "undefined"`.
- Dark mode is on by default. Use Tailwind `dark:` variants.
- Do not add a second intake store. Convex replaced localStorage in `d0a4390`.

## PDF fields

Checkbox on-values differ per field and are sniffed from `/AP`. There is no
name-based rule. On the I-130, every `_Yes[0]` field uses `/Y` and most
`_No[0]` fields use `/N`, but `Pt4Line20_No[0]` and `Pt4Line28_No[0]` use
`/Y`. Set both `/V` and `/AS`, sync radio-group parents and siblings, and
set `/NeedAppearances`. Details are in `README.md`.

To inspect a field while the API is running:

```bash
curl 'http://localhost:8000/debug/field/i-130?name=<urlencoded-name>'
```

Brackets encode as `%5B` and `%5D`.

## Type checking

`apps/web/tsconfig.json` enables `strict`, `noFallthroughCasesInSwitch`,
`noImplicitOverride`, `noImplicitReturns`, `forceConsistentCasingInFileNames`,
and `noUncheckedIndexedAccess`.

Still off, because turning them on rewrites intake components the UI work
is already touching:

- `exactOptionalPropertyTypes` (errors in `EmploymentHistory.tsx`,
  `AddressHistory.tsx`, the petitioner page, the address forms,
  `reviewDraft.ts`, and `playwright.config.ts`)
- `noUnusedLocals` and `noUnusedParameters`

Python uses pyright `basic` on `apps/api/app`, `tests`, and `scripts`.
`pdf_get` in `app/pdf_access.py` is the boundary around pikepdf stubs that
reject a list default. A stricter pyright mode is deferred until those
stubs can be described without casts in `scripts/render_fields.py`.

## Housekeeping

Do not commit run reports, cleanup summaries, task boards, or session logs.
`bun run check` fails if `cleanup_report.md` exists. Put that narration in
the pull request description.

pstack is vendored under `.cursor/skills` and `.cursor/agents` from
https://github.com/cursor/plugins/tree/main/pstack at commit `23e4138`
(version 0.15.6, MIT, Lauren Tan). Attribution is `.cursor/pstack/ATTRIBUTION.md`.
Do not edit those skills in place. Update them by copying a newer upstream
commit and changing the attribution file.
