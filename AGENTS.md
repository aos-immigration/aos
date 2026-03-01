# AGENTS.md

## Cursor Cloud specific instructions

### Services overview

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Next.js frontend | `cd apps/web && npx next dev --port 3000` | 3000 | Core UI; works without Convex (localStorage fallback) |
| FastAPI backend | `cd apps/api && npm run dev` | 8000 | PDF fill/extract; optional for most frontend work |
| Convex | Launched via `npx convex dev` (part of `npm run dev` in apps/web) | Cloud | Requires auth; app gracefully degrades without `NEXT_PUBLIC_CONVEX_URL` |

### Gotchas

- **Global yarn must not be installed.** Next.js 16's SWC binary resolution breaks when a global `yarn` binary exists alongside the npm `packageManager` field. If `next dev` fails with `"packageManager": "yarn@npm@10.8.2"` errors, run `npm uninstall -g yarn`.
- **Native binaries (SWC, lightningcss, tailwindcss-oxide).** If `npm install` was run from a lockfile generated on a different platform, native optional deps may be missing. Fix: delete `package-lock.json` and `node_modules`, then run `npm install` to regenerate with correct platform binaries.
- **Convex is optional for local development.** The `Providers` component in `apps/web/src/app/providers.tsx` skips the `ConvexProvider` when `NEXT_PUBLIC_CONVEX_URL` is not set. Forms still work via localStorage.
- **Python 3.11 required.** The `.python-version` file specifies 3.11. Install via `uv python install 3.11` if not available.
- **`uv` manages Python deps.** The `apps/api/package.json` has a `postinstall` hook that runs `uv sync`, so Python deps are installed automatically during `npm install`.

### Standard commands

See `CLAUDE.md` for the full command reference. Key commands from repo root:
- Lint: `npm run lint`
- Unit tests: `npm run test:unit`
- E2E tests: `npm run test:e2e` (requires Playwright browsers: `cd apps/web && npx playwright install chromium`)
- TypeScript check: `cd apps/web && npx tsc --noEmit`
