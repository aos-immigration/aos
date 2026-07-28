# AGENTS.md

See `CLAUDE.md` for the full architecture and the canonical lint/test/build/run
commands. This file only captures Cursor Cloud environment specifics.

## Cursor Cloud specific instructions

### Toolchain
- JS is managed with **bun** (`packageManager: bun@1.3.10`); Python (the API)
  with **uv**. Both are installed and symlinked into `/usr/local/bin`, so they
  are on `PATH` in fresh shells. The startup update script runs
  `bun install` and `UV_INDEX_URL=https://pypi.org/simple uv sync --project apps/api`.
- `uv` commands MUST be run with `UV_INDEX_URL=https://pypi.org/simple`. The
  committed `apps/api/uv.lock` pins a private Google Artifact Registry
  (`us-python.pkg.dev`) that is NOT reachable here; the override redirects to
  PyPI. The repo's own `apps/api` npm scripts already include this prefix.
- Running `uv sync` rewrites `apps/api/uv.lock` locally (private-registry URLs →
  PyPI URLs). This dirty change is expected — do NOT commit it.

### Services
- **Web (`apps/web`)** — Next.js on `:3000` plus a local **Convex** backend on
  `:3210`. Start with `cd apps/web && CONVEX_AGENT_MODE=anonymous bun run dev`
  (the `dev` script runs `npx convex dev & next dev`).
- **API (`apps/api`)** — FastAPI on `:8000`. Start with `cd apps/api && bun run dev`.
- Both together: `CONVEX_AGENT_MODE=anonymous bun run dev` from the repo root
  (turbo runs web + api in parallel).

### Convex is required for the web UI (non-obvious)
- The app shell (`src/components/DashboardLayout.tsx`) and the petitioner /
  address / employment pages call Convex `useQuery`/`useMutation`, so the intake
  UI needs a running Convex deployment; without it those pages error.
- Convex `dev` prompts for login and **fails in non-interactive terminals**.
  Set `CONVEX_AGENT_MODE=anonymous` to run a local, account-free deployment.
- First run downloads the Convex backend binary and writes `apps/web/.env.local`
  (gitignored) with `NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210`. It also
  generates untracked `apps/web/convex/README.md` and `apps/web/convex/tsconfig.json`
  — do NOT commit these.

### API PDF forms
- The FastAPI `/fields/{slug}` and `/fill/{slug}` endpoints read USCIS PDFs from
  the repo-root `Forms/` directory (e.g. `Forms/i-130.pdf`). These files must be
  present for the API to return PDFs.

### Lint / test notes
- `bun run lint`: the **web** package currently has pre-existing lint errors
  (unrelated to environment setup); `api` lint passes.
- `bun run test:unit` runs the web Vitest suite. Playwright e2e (`bun run test:e2e`)
  needs browser binaries and a running web+Convex stack.
