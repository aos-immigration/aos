#!/usr/bin/env bash
# Next.js dev server. Starts Convex only when a deployment URL is already set,
# so `bun run dev` can show the demo with no Clerk or Convex account.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -n "${NEXT_PUBLIC_CONVEX_URL:-}" ]]; then
  npx convex dev &
  convex_pid=$!
  trap 'kill "$convex_pid" 2>/dev/null || true' EXIT
fi

exec ./node_modules/.bin/next dev
