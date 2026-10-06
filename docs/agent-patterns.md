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

## Documents is a checklist and proof is coming soon

`/sections/documents` and `/sections/proof` used to 404 outside the shell.
`/sections/documents` is `wired` in `docs/feature-map.json`. It stores a
chosen file name and never marks a file accepted. `/sections/proof` is
`mocked`. The page says the section is not available yet.

Guard: the feature-map check fails if either page or sidebar href
disappears. `mockSections.test.tsx` renders the proof page. It does not
render the documents page.

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
the demo intake and to fill signed-in previews from that caller's saved rows.
`/fill-intake`, `/preview-intake`, and `/packet` use that same proxy. The
browser posts to `/api/preview-intake` and `/api/packet` with no body.

Guard: `apps/web/src/app/api/fill/[slug]/route.test.ts` posts a hostile body
and expects the upstream intake to be Jordan Sampleton, and expects a signed-in
call to pass `{ slug }` into the Convex action. With `NEXT_PUBLIC_DEMO_ONLY=1`,
that same file expects a signed-in fill, preview, and packet to post the
Sampleton intake and not call Convex. `apps/api/tests/test_fill_auth.py`
rejects `/fill-intake`, `/preview-intake`, and `/packet` with no
`X-Fill-Secret`. `bun run check` runs both tests.

## PDF rate limits follow the caller, not `X-Forwarded-For`

`_rate_ok` used the first `X-Forwarded-For` address, so a client could pick
a new bucket by changing that header.

Guard: `apps/api/tests/test_fill_auth.py` sends the same `X-Fill-Caller`
with two forwarding headers and expects the second request to be 429, then
a different caller to be allowed. The key is the header the web server sets
next to `X-Fill-Secret`.

## Fill auth and the origin allowlist stay together

`#83` (`c61a06c`) put `ALLOWED_ORIGINS` and the form slug allowlist in
`apps/api/app/http_policy.py`. `#81` requires `X-Fill-Secret` and rate-limits
`X-Fill-Caller`. Taking only one side of that CORS conflict drops a gate:
either anonymous fill, or a wildcard origin, or a slug that is not on the
allowlist.

Guard: `apps/api/tests/test_api.py` expects the localhost origin, no
credentials, a preflight that allows `X-Fill-Secret` and `X-Fill-Caller`, a
422 that does not echo the submitted value, and `Cache-Control: no-store`.
`test_fill_auth.py` still rejects a missing secret and keys the limit on
`X-Fill-Caller`. `form_pdf` rejects any other slug. Do not bring back
`PDF_ALLOWED_ORIGINS`.

## Identity numbers are not plaintext columns

SSN, A-Number, I-94, and passport number for the petitioner and the
beneficiary were accepted as strings inside the intake JSON and written
with `JSON.stringify`.

Guard: `STORED_ID_FIELD_NAMES` in `apps/web/convex/storedIds.ts`.
`saveIntake` encrypts a valid SSN and A-Number for both people.
`stripStoredIds` blanks every other catalog id, and blanks an SSN or
A-Number that is not already ciphertext. `storedIds.test.ts` saves a
sentinel for every name and expects the plaintext to be absent, and it
saves real SSN and A-Number values and expects ciphertext plus last4.
The schema scan fails if any of those names is declared `v.string()` in
`apps/web/convex`. Add a new id to the list; do not add a new test
function.

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

## USCIS editions expire

USCIS can reject an edition with no grace period. `fc102bf` on #94 replaces the
I-485 in `Forms/`, which was still 01/20/25 on October 6, 2026, when USCIS
accepted only 09/18/26.
A newer edition is not always the one USCIS accepts. A September 14, 2026
court order means USCIS is not accepting I-765 edition 09/15/26, so that
form stays on 08/21/25.

Guard: `Forms/editions.json` records the slug, edition date, uscis.gov
URL, and last-checked date for each bundled PDF.
`apps/api/tests/test_form_editions.py` reads the footer
`Form X Edition MM/DD/YY` on every page. It fails when the footer
disagrees with the manifest, when a PDF in `Forms/` is missing from the
manifest, or when a manifest entry has no PDF. It checks `apps/api/forms`
when that directory has PDFs, and it checks the copy `stage_forms`
writes. The test does not use the network.

## Preview responses stay under 4.5MB

`cc3c554` on #91 lowered preview render from scale 2 and JPEG quality 80
to scale 1, quality 40, and `optimize=True`. GitHub squash-merged #91 as
`702e1f2`. That fix records page images of about 20MB at the old
settings, and a Sampleton preview body of 3.9MB after the change. Vercel
rejects a function response over 4.5MB. The API and the Next preview
route both return that JSON.

Guard: `test_preview_returns_images_without_acknowledgement` in
`apps/api/tests/test_map_intake.py` asserts
`len(response.content) < 4_500_000` for the Sampleton packet. Do not
raise preview scale or JPEG quality unless the Sampleton preview, or
another preview of the full packet, stays under that 4.5MB limit.
