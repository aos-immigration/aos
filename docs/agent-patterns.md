# Agent patterns

Catalog of mistakes that already cost a fix in this repo, and the guard that
now blocks each one. Process: `docs/review-lessons.md`. Agents enter through
`.cursor/skills/review-lessons/SKILL.md`.

Merged PRs have no substantive review comments. Entries cite the fix commit
or the PR that corrected the mistake. TODO means the product change is
intentionally not done here.

## Checkbox on-values come from `/AP`

`ea8cb3c` (#74) stopped deriving on-values from field names. On the I-130,
`Pt4Line20_No[0]` and `Pt4Line28_No[0]` use `/Y`, like the Yes fields.
`7ac8c30` had to correct fixtures that used the wrong token.

Guard: `apps/api/scripts/eval_fill.py` checks that the written `/V` and
`/AS` are legal `/AP` states. `bun run check` runs it. Do not add a
name-based rule back.

## Do not commit agent exhaust

`f066d13` (#72) deleted committed junk and a `cleanup_report.md` pattern
that made many cleanup PRs conflict. The old `CLAUDE.md` banned those files
in prose only.

Guard: `scripts/check.sh` fails if `cleanup_report.md` is in the tree. Put
the narration in the pull request description.

## Docs that disagree with the code

`046c79c` (#77) corrected README and CLAUDE claims about checkbox rules,
lint counts, the build failure page, and which turbo scripts exist.

Guard: `docs/feature-map.md` is generated, and `scripts/feature_map.py
--check` fails when pages, API routes, or sidebar hrefs drift. `CLAUDE.md`
points at `AGENTS.md` so the command list is not copied twice.

TODO: nothing checks README prose against the code. When a command or a
boundary changes, update `AGENTS.md` and the matching README section in the
same change.

## `npx tsc` installs the wrong package

`npx tsc` does not see `apps/web/node_modules/.bin/tsc` and downloads an
unrelated package named `tsc`.

Guard: `scripts/check.sh` calls the local binary. Agents run `bun run check`.

## ESLint errors were left on main

`1708a04` (#75) fixed unescaped JSX quotes and `react-hooks/set-state-in-effect`.
Lint is clean of errors and still has warnings.

Guard: `bun run check` runs eslint in `apps/web` and fails on errors.
Warnings do not fail the run. Do not "fix" warnings by editing mock pages
unless that is the task.

## Zod schema gaps are recorded as failing tests

`e6e485e` (#76) added `it.fails` tests for behavior the schemas still
accept.

- `addressSchema` requires a US ZIP for every country.
  `validateZipCode` in `addressValidation.ts` applies that pattern only for
  US, USA, and United States. The international cases already pass in
  `addressValidation.test.ts`.
- Address and employment months accept any non-empty string.
- Whitespace-only required strings pass, except `employerName`.
- Date of birth day and year are not validated.

Guard: those `it.fails` tests. When a gap is fixed, the test starts failing
and should become a normal `it`. Do not flip them early, and do not copy
the US ZIP regex into `validateZipCode`.

## `EmploymentHistory` hardcodes `personRole`

`EmploymentHistory.tsx` writes and lists `personRole: "petitioner"`.
`AddressHistory` takes the role as a prop. Beneficiary employment is a
separate mock page, so the hardcode currently only affects the petitioner
screen, and it will be wrong the moment that component is reused.

TODO: no guard that fails CI. Changing the role is a later product change.

## Saved-section count replaces fake progress

Sidebar dots and the header count used to be hardcoded, including a 64% bar
and the name "John Doe". `sectionSaveState` now marks a section saved only
when that section has stored data. Sections with no table stay not saved.
The header text is "{n} of {persistable} sections saved" and includes no
percent.

Guard: `apps/web/src/app/lib/__tests__/sectionSaveState.test.tsx` and
`mockSections.test.tsx`. `bun run check` runs both.

## Coming-soon pages for documents and proof

`/sections/documents` and `/sections/proof` used to 404 outside the shell.
They are now pages that say the section is not available yet.

Guard: both are `mocked` pages in `docs/feature-map.json`. The feature-map
check fails if the href or the page disappears. `mockSections.test.tsx`
renders the document vault page.

## Employment never reaches the PDF

`buildPdfPayload` takes `_employment` and does not write those fields.

TODO: no guard that would lock the bug in. A test that expects the fields
to be absent would fight the fix.

## Every address is saved as physical

`AddressHistory.tsx` sends `addressType: "physical"`. The mailing branch in
`buildPdfPayload` does not run for rows the UI saves.

TODO: same as employment. Do not add a test that requires the bug.

## Convex query data is `undefined` while loading

`c829392` fixed the petitioner form initializing from a query that had not
loaded. `#75` then removed a `set-state-in-effect` that existed to copy
that data into state.

Guard: `react-hooks/set-state-in-effect` runs inside `bun run check`. Treat
a Convex `undefined` result as loading. Do not copy it into React state
from an effect.

## Do not bring back a localStorage intake store

`d0a4390` moved intake to Convex. `intakeStorage.ts` is types and
factories. `sessionStorage` is the preview draft. `localStorage` is the
theme.

Guard: the convention in `AGENTS.md`. There is no lint, because a ban on
`localStorage` would also ban the theme.
