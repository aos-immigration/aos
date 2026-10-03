#!/usr/bin/env bash
# Install web dependencies and sync the API virtualenv.
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v bun >/dev/null 2>&1; then
  echo "FAIL setup: bun is not on PATH (this repo pins bun@1.3.10)"
  exit 1
fi

if ! command -v uv >/dev/null 2>&1; then
  echo "FAIL setup: uv is not on PATH"
  exit 1
fi

bun install
echo "PASS setup"
