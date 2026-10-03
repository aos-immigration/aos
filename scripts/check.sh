#!/usr/bin/env bash
# One-command check. Exit 0 only when every step passes.
# Web steps run alongside the API bundle and the agent-surface check.
# API steps share one uv environment, so they run one after another.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export TURBO_TELEMETRY_DISABLED=1

if [[ ! -x "$ROOT/apps/web/node_modules/.bin/tsc" ]]; then
  echo "FAIL setup: apps/web/node_modules is missing. Run bun run setup."
  exit 1
fi

if [[ ! -x "$ROOT/node_modules/.bin/turbo" ]]; then
  echo "FAIL setup: turbo is missing. Run bun run setup."
  exit 1
fi

banned="$(find "$ROOT" -name cleanup_report.md -not -path '*/node_modules/*' -not -path '*/.git/*' || true)"
if [[ -n "$banned" ]]; then
  echo "FAIL housekeeping: remove cleanup_report.md (put the note in the PR description)"
  echo "$banned"
  exit 1
fi

LOG_DIR="$(mktemp -d)"
cleanup() { rm -rf "$LOG_DIR"; }
trap cleanup EXIT

start() {
  local name="$1"
  shift
  (
    set +e
    "$@" >"$LOG_DIR/$name.log" 2>&1
    echo $? >"$LOG_DIR/$name.exit"
  ) &
  echo $! >"$LOG_DIR/$name.pid"
}

web_lint() {
  cd "$ROOT/apps/web"
  ./node_modules/.bin/eslint .
}

web_typecheck() {
  cd "$ROOT/apps/web"
  ./node_modules/.bin/tsc --noEmit --pretty false
}

unit_tests() {
  cd "$ROOT"
  ./node_modules/.bin/turbo run test:unit --output-logs=full
}

api_checks() {
  cd "$ROOT/apps/api"
  local status=0
  echo "-- api-tests --"
  if ! uv run pytest; then
    status=1
  fi
  echo "-- api-typecheck --"
  if ! uv run pyright; then
    status=1
  fi
  echo "-- pdf-eval --"
  if ! uv run python scripts/eval_fill.py fixtures/; then
    status=1
  fi
  return "$status"
}

agent_surface() {
  cd "$ROOT"
  python3 scripts/verify_agent_surface.py
}

feature_map() {
  cd "$ROOT"
  python3 scripts/feature_map.py --check
}

web_build() {
  cd "$ROOT/apps/web"
  env \
    -u NEXT_PUBLIC_CONVEX_URL \
    -u NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
    -u CLERK_SECRET_KEY \
    -u PDF_FILL_SECRET \
    -u CLERK_JWT_ISSUER_DOMAIN \
    ./node_modules/.bin/next build
}

start web-lint web_lint
start web-typecheck web_typecheck
start unit-tests unit_tests
start api api_checks
start agent-surface agent_surface
start feature-map feature_map

fail=0
for name in web-lint web-typecheck unit-tests api agent-surface feature-map; do
  pid="$(cat "$LOG_DIR/$name.pid")"
  wait "$pid" || true
  code="$(cat "$LOG_DIR/$name.exit")"
  echo
  echo "========== $name =========="
  if [[ "$code" == "0" ]]; then
    echo "PASS $name"
    grep -E '^(PASS |FAIL |-- )|[0-9]+ passed|All .*fixture' "$LOG_DIR/$name.log" || true
    tail -n 8 "$LOG_DIR/$name.log"
  else
    echo "FAIL $name"
    cat "$LOG_DIR/$name.log"
    fail=1
  fi
done

echo
echo "========== web-build =========="
if web_build >"$LOG_DIR/web-build.log" 2>&1; then
  echo "PASS web-build"
  tail -n 12 "$LOG_DIR/web-build.log"
else
  echo "FAIL web-build"
  cat "$LOG_DIR/web-build.log"
  fail=1
fi

echo
if [[ "$fail" == "0" ]]; then
  echo "check: PASS"
  exit 0
fi

echo "check: FAIL"
exit 1
