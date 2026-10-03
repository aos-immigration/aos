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
cd apps/web && npm run test:e2e                    # needs Convex + browsers, see below
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
4. PDF mapping change → `uv run python scripts/render_fields.py fixtures/<f>.json`
   then view the PNG crops to confirm values render in the right boxes
5. UI change → `npm run test:e2e` if the environment supports it

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

## Testing as an agent

On a Cursor Cloud Agent VM the environment's `start` script already runs both
servers in tmux sessions: `api` (FastAPI on :8000, log `/tmp/api.log`) and
`web` (Convex + Next.js on :3000, log `/tmp/web.log`). Check before starting
anything:

```bash
curl -fs localhost:8000/health && curl -fs -o /dev/null localhost:3000 && echo up
```

If they are down, start them yourself in tmux:

```bash
(cd apps/api && npm run dev)
(cd apps/web && CONVEX_AGENT_MODE=anonymous npm run dev)
```

Convex runs as a local anonymous backend on `127.0.0.1:3210`, with no login or
deploy key. The pinned CLI (1.32) still prompts for a login unless
`CONVEX_AGENT_MODE=anonymous` is set. The environment's `install` writes
`apps/web/.env.local`. Only one local backend can run at a time, so do not run
`convex dev --once` while `web` is up. The CLI also generates untracked
`convex/README.md` and `convex/tsconfig.json`; do not commit them.

- **e2e:** `cd apps/web && npm run test:e2e`. Playwright reuses the server
  already on :3000. Chromium is preinstalled.
- **Video proof for UI changes:** drive the desktop Chrome at
  `http://localhost:3000` with computer use while recording the screen. Save the
  recording under `/opt/cursor/artifacts/` and embed it in the PR description.
  Never commit videos.

## Housekeeping

Do not commit run reports, cleanup summaries, task boards, or session logs. A
scheduled agent previously wrote `cleanup_report.md` on every run, which made
30 pull requests conflict with each other. Put that kind of narration in the
pull request description instead.
