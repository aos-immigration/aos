---
name: review-lessons
description: Before finishing a change, check the diff against docs/agent-patterns.md. When addressing PR review or a fix-up, append the recurring lesson and encode it as a lint, test, or check. Use for /review-lessons.
---

# Review lessons

The catalog is `docs/agent-patterns.md`. The process for humans is
`docs/review-lessons.md`. This skill is the only agent entry point. Do not
start a second list, and do not paste the catalog into this file.

## Before you finish

1. Read `docs/agent-patterns.md`.
2. Walk the diff. For every lesson that names a file or behavior you
   touched, confirm the guard still holds.
3. If you added or removed a `page.tsx`, a FastAPI route, or a sidebar
   `href`, update `docs/feature-map.json` and run
   `python3 scripts/feature_map.py --write`.
4. Run `bun run check`.

A lesson marked TODO is not permission to change product behavior. The UI
honesty work owns fake progress, dead links, and placeholder copy.

## When you address review feedback or a fix-up

1. Fix the reported issue.
2. If the mistake would recur, append one section to
   `docs/agent-patterns.md`. Include the PR or commit, the pattern, and the
   guard.
3. Encode the guard in the strongest form that stays cheap. A CI check, then
   a test, then a lint rule, then an always-applied rule. Docs-only is the
   fallback when a structural guard would change product behavior.
4. Run `bun run check` again after the catalog edit so the new guard is what
   CI runs.
