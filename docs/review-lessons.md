# Review lessons

This is the process. The catalog is `docs/agent-patterns.md`. The agent
entry point is `.cursor/skills/review-lessons/SKILL.md`. Do not keep a
second list of lessons.

## Before finishing

Read `docs/agent-patterns.md`. For each lesson that touches a file in the
diff, confirm the guard still holds or that the change is the exception the
lesson allows. Run `bun run check`.

## When review feedback or a fix-up lands

1. Fix the reported issue.
2. If the same mistake would recur, append one section to
   `docs/agent-patterns.md`. Name the PR or commit that showed it, the
   pattern, and the guard.
3. Encode the guard when that is cheap. Prefer a check that fails CI, then
   a test, then a lint rule, then an always-applied agent rule. A sentence
   in a doc is the last resort.
4. If the guard would change product behavior, mark the lesson TODO and
   leave the behavior alone.
5. If a page, API route, or sidebar href changed, update
   `docs/feature-map.json` and run `python3 scripts/feature_map.py --write`.

## Where the seed came from

Merged pull requests have no substantive review comments. The catalog is
seeded from fix commits and the PRs that corrected them (`#72`, `#74`,
`#75`, `#76`, `#77`) plus the patterns already visible in the code.
