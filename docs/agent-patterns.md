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

TODO: no guard that fails CI. Changing the role is a product change. Left
for the UI honesty work.

## Fake progress and placeholder chrome

Sidebar section percentages, the header "PROGRESS 64%" bar in
`DashboardLayout.tsx`, and the 64% label on `/forms/i-485/biographic` are
hardcoded. The header user name is hardcoded too.

TODO: no guard. The UI honesty work owns the product change. Do not invent
a percentage while that work is in flight.

## Sidebar links with no page

`/sections/documents` and `/sections/proof` are sidebar hrefs. There is no
`page.tsx` for either.

Guard: both are `missing` in `docs/feature-map.json`. The feature-map check
fails if the href is removed or a page appears without a status change.

TODO: adding the pages is the UI honesty work.

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

## `/api/fill` is not a proxy for a client field map

The demo preview posted whatever JSON the browser built, and a signed-in
caller could do the same. Legal review of #81 required the server to build
the demo I-130 and to fill signed-in previews from that caller's saved rows.

Guard: `apps/web/src/app/api/fill/[slug]/route.test.ts` posts a hostile body
and expects the upstream fields to be Alex Demo, and expects a signed-in
call to pass `{}` into the Convex action. `fillI130` takes no field map.
`bun run check` runs both tests.

## PDF rate limits follow the caller, not `X-Forwarded-For`

`_rate_ok` used the first `X-Forwarded-For` address, so a client could pick
a new bucket by changing that header.

Guard: `apps/api/tests/test_fill_auth.py` sends the same `X-Fill-Caller`
with two forwarding headers and expects the second request to be 429, then
a different caller to be allowed. The key is the header the web server sets
next to `X-Fill-Secret`.

## Identity numbers are not plaintext columns

SSN, A-Number, I-94, and passport number for the petitioner and the
beneficiary were accepted as strings inside the intake JSON and written
with `JSON.stringify`.

Guard: `STORED_ID_FIELD_NAMES` in `apps/web/convex/storedIds.ts`.
`stripStoredIds` blanks those keys before `saveIntake` writes.
`storedIds.test.ts` saves a sentinel for every name and expects it to be
absent. The schema scan fails if any of those names is declared
`v.string()` in `apps/web/convex`. Add a new id to the list; do not add a
new test function.

## Convex execution logs store argument size, not argument values

`saveSensitiveIds` receives a plaintext SSN as a mutation argument. The
Convex log stream schema records `usage.function_args_bytes` and
`console.log` text, not the argument object. The CLI printer in
`convex/dist/esm/cli/lib/logs.js` prints console lines and errors. A dev
deployment forwards those console lines to the calling browser.

Guard: the schema scan above fails if a Convex function calls `console.log`
(or info, debug, warn, error, trace). Do not print `args`. An action whose
arguments were the plaintext number would still be the wrong place to put
it, because a later `console.log(args)` would ship it. Encrypt in the
mutation, then store ciphertext. HTTP actions omit even the byte count;
they are not required here, because the value is not in the execution log.

## Account deletion does not run in the browser

`/account` called `user.delete()` from the Clerk client after a Convex
mutation. A user deleted in the Clerk dashboard left their rows behind, and
a retried browser call could stop after one of the two steps.

Guard: `deleteAccount` purges Convex rows, then deletes the Clerk user, and
treats HTTP 404 as already done. `handleClerkWebhook` checks the Svix
signature and purges on `user.deleted`. `deleteAccount.test.ts` covers the
order, the retry, the second webhook delivery, and that `account/page.tsx`
does not call `user.delete`. `purgeOwner` in `sensitive.test.ts` deletes one
owner twice and leaves the other.
