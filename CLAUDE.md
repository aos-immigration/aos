# CLAUDE.md

Guidance for coding agents working in this repository. Read `README.md` first —
it covers the architecture, what is real versus mocked, and the PDF pipeline.

## Commands

```bash
bun install                                        # web deps + `uv sync` for the API

cd apps/web && npm run dev                         # Convex + Next.js on :3000
cd apps/api && npm run dev                         # FastAPI on :8000

npm run test:unit                                  # vitest, from the repo root
cd apps/web && ./node_modules/.bin/tsc --noEmit    # NOT `npx tsc`
cd apps/web && npm run lint
cd apps/web && npm run test:e2e                    # needs Convex login + browsers
cd apps/api && uv run python scripts/eval_fill.py fixtures/
```

`npx tsc` does not work here — it misses the local binary and installs an
unrelated package named `tsc`. Always use `./node_modules/.bin/tsc`.

`npm run lint` currently fails on `main` with pre-existing errors. Compare
against the baseline rather than assuming you caused them.

## After making changes

1. Logic change → `npm run test:unit`
2. Any TypeScript change → `./node_modules/.bin/tsc --noEmit`
3. PDF fill change → `uv run python scripts/eval_fill.py fixtures/`
4. UI change → `npm run test:e2e` if the environment supports it

## Code patterns

- Forms use React Hook Form with a Zod resolver. Schemas live in
  `apps/web/src/app/lib/schemas/`. Do not hand-roll field validation.
- Convex is the only persistence layer. `intakeStorage.ts` is types and factory
  helpers despite its name; `sessionStorage` is used only for the PDF preview
  draft, and `localStorage` only for the theme.
- Discriminated unions for form field values (`MonthValue`, `RelationshipValue`,
  `EmploymentStatus`).
- Guard browser APIs with `typeof window !== "undefined"`.
- Dark mode is on by default; use Tailwind `dark:` variants.

## PDF field gotchas

Checkbox on-values differ per field. `_Yes[0]` fields take `/Y`, `_No[0]` fields
take `/N`, and everything else is sniffed from the `/AP` dictionary. Set both
`/V` and `/AS`, sync radio-group parents and siblings, and set
`/NeedAppearances`. To inspect a field:

```bash
curl 'http://localhost:8000/debug/field/i-130?name=<urlencoded-name>'
```

Brackets encode as `%5B` and `%5D`. Full explanation in `README.md`.

## Housekeeping

Do not commit run reports, cleanup summaries, task boards, or session logs. A
scheduled agent previously wrote `cleanup_report.md` on every run, which made
30 pull requests conflict with each other. Put that kind of narration in the
pull request description instead.
