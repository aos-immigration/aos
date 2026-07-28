# Repository Health Audit — 2026-07-28

Read-only investigation of the AOS repo: pull request backlog, build/test/lint
status on `main`, and the developer-tooling problems that produced both.

Everything below was verified by running the commands listed, against
`main` @ `aac7b74`.

---

## 1. Summary

| Finding | Status |
| --- | --- |
| Open pull requests | 65 |
| Of those, produced by the scheduled cleanup agent | 59 |
| Pull requests ever merged (lifetime) | 5 |
| Pull requests ever closed without merging | 0 |
| Last commit on `main` | 2026-03-04 |
| `npm run test:unit` on `main` | passes (38 tests) |
| `apps/web` type check on `main` | passes |
| `npm run lint` on `main` | **fails** (12 errors, 21 warnings) |
| `npm run build` on `main` | **fails** without `NEXT_PUBLIC_CONVEX_URL` |
| `npx tsc --noEmit` (the documented type-check command) | **runs the wrong program** |
| CI workflows | none (`.github/workflows` does not exist) |

The backlog is not 59 distinct pieces of work. It is roughly **two ideas,
proposed over and over**, because nothing ever merges and the agent re-derives
the same conclusions from the same unchanged `main` every day.

---

## 2. The pull request backlog

### 2.1 Nothing has merged since March

`main` has not advanced since 2026-03-04, while the cleanup agent has opened a
pull request nearly every day from 2026-02-05 through 2026-07-08.

```
$ git log -1 --format='%h %ci' origin/main
aac7b74 2026-03-04 06:41:40 -0800

$ git log origin/main --format='%ci' | cut -c1-7 | uniq -c
      4 2026-03
     32 2026-02
      6 2026-01
```

Because the branches are cut from an unchanging `main`, most report
`behind_main=0` and `MERGEABLE`. They are not stale in the git sense — they are
simply never looked at. The 16 that do conflict are the older ones, cut before
`main` last moved.

No pull request has ever been closed without merging, which means the backlog
has no triage process at all — only accumulation.

### 2.2 Twenty pull requests are byte-identical duplicates

Comparing code-only diffs against `main` (excluding the generated report files)
collapses large groups of pull requests to a single hash:

| Identical code diff | Pull requests | What it does |
| --- | --- | --- |
| `f14ae2898b` | 55, 56, 57, 60, 62, 67, 68 | Delete the dead gap-detection cluster |
| `e5134127af` | 42, 43, 46, 47, 48, 50, 51, 52 | Delete `useAddressValidation.ts` + `validateAddress` |
| `88f3527075` | 54, 58, 61 | Delete `useAddressValidation.ts` + `GapExplanationDialog.tsx` |
| `fd42ba65cb` | 37, 41 | Delete `useAddressValidation.ts` + `validateAddress` |

Twenty pull requests, four unique changes. Reproduce with:

```bash
for pr in 55 56 57 60 62 67 68; do
  br=$(gh pr view $pr --json headRefName --jq .headRefName)
  git diff origin/main...origin/$br -- ':!cleanup_report.md' | md5sum
done   # all seven print the same hash
```

The remaining pull requests are overlapping variants of the same two themes
rather than exact copies.

### 2.3 The whole backlog orbits five files

Counting how many open pull requests touch each path:

```
53  apps/web/src/app/components/intake/useAddressValidation.ts
35  apps/web/src/app/lib/addressValidation.ts
30  cleanup_report.md
22  apps/web/src/app/components/intake/GapExplanationDialog.tsx
19  apps/web/src/app/lib/__tests__/addressValidation.test.ts
16  apps/web/src/app/lib/schemas/addressSchema.ts
15  apps/web/src/app/lib/__tests__/gapDetection.test.ts
15  apps/web/src/app/lib/gapDetection.ts
```

`useAddressValidation.ts` — a 48-line file — is touched by 53 of 65 open pull
requests.

### 2.4 `cleanup_report.md` is the conflict engine

The agent writes its run summary to `cleanup_report.md` at the repo root and
commits it. Thirty open pull requests modify that one file, so any two of them
conflict *even when their code changes are completely disjoint*.

Demonstrated by merging the two representative pull requests, one from each
theme, onto `main`:

```
$ git merge --no-ff origin/<pr-68-branch>     # clean
$ git merge --no-ff origin/<pr-69-branch>
Auto-merging cleanup_report.md
CONFLICT (content): Merge conflict in cleanup_report.md

$ git diff --name-only --diff-filter=U
cleanup_report.md
```

The only conflict is the status file. The actual source changes merge cleanly.

### 2.5 Build artifacts are being committed

`.gitignore` covers `node_modules`, `.next`, `.turbo`, and Python caches, but
not Playwright output or logs. As a result some pull requests carry generated
files:

- PR #24 — `apps/web/dev.log`, `apps/web/playwright-report/index.html`, `apps/web/test-results/.last-run.json`
- PR #44 — failure screenshots under `apps/web/test-results/`, plus `playwright-report/data/*.png`
- PR #6 — `package-lock.json`, although this repo uses `bun.lock`

Missing from `.gitignore`: `test-results/`, `playwright-report/`, `*.log`,
`package-lock.json`.

---

## 3. Is the proposed cleanup actually correct?

Yes. The recurring change is real dead code, and it was verified rather than
assumed.

`useAddressValidation.ts` has no importers anywhere in `src/` or `e2e/`. It is
the *only* consumer of `hasSignificantGap`, and the only consumer of
`validateAddress`. `GapExplanationDialog.tsx` likewise has no importers. So the
whole cluster is reachable only from its own tests:

```
$ rg -n "useAddressValidation|GapExplanationDialog" apps/web/src apps/web/e2e --glob '!**/__tests__/**'
apps/web/src/app/components/intake/useAddressValidation.ts:19:export function useAddressValidation(
apps/web/src/app/components/intake/GapExplanationDialog.tsx:30:export function GapExplanationDialog({
```

Not dead, and must be kept: `validateAllAddresses` is imported by
`AddressHistory.tsx`, so `addressValidation.ts` itself stays. Only the
`validateAddress` entry point is unreachable.

Both representative pull requests were checked out and exercised:

| | unit tests | type check |
| --- | --- | --- |
| PR #68 (delete gap-detection cluster) | 31 passed | clean |
| PR #69 (extract `AddressFormFields.tsx`) | 38 passed | clean |
| both merged together | 31 passed | clean |

PR #68 drops the count from 38 to 31 because it deletes `gapDetection.test.ts`
along with the code under test — the correct outcome for a dead-code removal.
The other 14 address tests stay: `validateRequiredFields`, `validateZipCode`,
and `validateDateRange` are never imported directly by a component, but
`validateAllAddresses` calls all three internally, so they remain on a live
code path.

---

## 4. Why the agent keeps failing its own checklist

`specs/tasks/scheduled-cleanup-agent.md` instructs each run to type check, run
unit tests, run Playwright, and manually verify in a browser. Three of those
five steps cannot succeed as written.

### 4.1 The documented type-check command runs the wrong program

`CLAUDE.md` and the agent prompt both specify:

```bash
cd apps/web && npx tsc --noEmit
```

In this repo that does not invoke TypeScript. `npx` fails to resolve the local
binary and downloads an unrelated package named `tsc` (version 2.0.4, a
long-deprecated wrapper) instead:

```
npm warn exec The following package was not found and will be installed: tsc@2.0.4
                This is not the tsc command you are looking for
```

TypeScript 5.9.3 *is* installed and `node_modules/.bin/tsc` is a valid symlink;
`npx` simply does not pick it up under this bun-installed tree. Reproducible
after clearing the `_npx` cache.

Working alternatives, both verified clean on `main`:

```bash
cd apps/web && ./node_modules/.bin/tsc --noEmit   # exit 0
cd apps/web && bunx tsc --noEmit                  # exit 0
```

So every "Type Check: Passed" line in a cleanup report is meaningless — the
step never ran the compiler.

### 4.2 The build fails whenever `NEXT_PUBLIC_CONVEX_URL` is unset

`providers.tsx` degrades gracefully when the Convex URL is missing:

```ts
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;
if (!convex) return children;          // no ConvexProvider in the tree
```

The intent is reasonable, but the effect is the opposite of graceful. Pages
that call `useMutation` are statically prerendered, so dropping the provider
turns a missing environment variable into a hard build failure:

```
Error occurred prerendering page "/forms/i-130/beneficiary"
Error: Could not find Convex client! `useMutation` must be used in the React
component tree under `ConvexProvider`.
⨯ Next.js build worker exited with code: 1
```

With any non-empty URL the build succeeds and renders all 18 routes:

```bash
NEXT_PUBLIC_CONVEX_URL="https://example-dummy-123.convex.cloud" npm run build   # succeeds
```

A missing env var should produce a clear startup error, not a prerender crash
in an unrelated page.

### 4.3 End-to-end tests cannot run in a sandbox

`playwright.config.ts` starts the app with `webServer.command: "npm run dev"`,
and that script is:

```json
"dev": "bash -lc \"npx convex dev & next dev\""
```

`convex dev` needs an authenticated Convex account, and Playwright browsers are
not installed in the agent image (`~/.cache/ms-playwright` is absent). This is
exactly what the committed `cleanup_report.md` records: *"E2E: Skipped due to
sandbox environment issues (Convex login/yarn configuration)."* The instruction
has never been satisfiable, on any run.

### 4.4 Nothing enforces any of it

There is no `.github/workflows` directory. No pull request in the backlog has
ever been build-, lint-, or test-checked by automation. The only quality signal
is the agent's own self-report, and per 4.1 that self-report is partly fiction.

---

## 5. `main` is not green

Independent of the backlog, `main` itself does not pass its own lint script:

```
$ npm run lint
✖ 33 problems (12 errors, 21 warnings)
```

By rule:

| Count | Severity | Rule |
| --- | --- | --- |
| 10 | error | `react/no-unescaped-entities` |
| 2 | error | `react-hooks/set-state-in-effect` |
| 8 | warning | `@typescript-eslint/no-unused-vars` |
| 4 | warning | `react-hooks/exhaustive-deps` |
| 4 | warning | `react-hooks/incompatible-library` |
| 1 | warning | `jsx-a11y/alt-text` |

The 10 errors are unescaped apostrophes in JSX and are mechanically fixable.
The 2 `set-state-in-effect` errors (including `ThemeToggle.tsx`) are real
cascading-render smells worth a proper look.

Also stray: `main.py` at the repo root is an unused `print("Hello from aos!")`
stub left over from `uv init`, unrelated to `apps/api/app/main.py`.

---

## 6. Recommendations

Ordered by leverage. The first three unblock everything else.

**1. Merge one pull request per theme, close the other 57.**
The backlog is four unique changes. Merge #68 (dead gap-detection cluster,
verified green) and #69 (extract `AddressFormFields.tsx`, verified green),
resolving the `cleanup_report.md` conflict by discarding it per item 2. Close
the rest with a pointer to the merged pair.

**2. Stop committing `cleanup_report.md`.**
It causes conflicts among 30 pull requests whose code does not overlap. The run
summary belongs in the pull request description, not in a tracked file at the
repo root. Delete it and add it to `.gitignore`.

**3. Add a CI workflow.**
Even a minimal one — `bun install`, `./node_modules/.bin/tsc --noEmit`,
`npm run test:unit`, `npm run build` with a dummy `NEXT_PUBLIC_CONVEX_URL` —
converts the agent's unverifiable self-reports into an enforced signal. Note
that `npm run lint` cannot be a required gate until item 5 is done.

**4. Fix the documented type-check command.**
Replace `npx tsc --noEmit` with `./node_modules/.bin/tsc --noEmit` in
`CLAUDE.md` and `specs/tasks/scheduled-cleanup-agent.md`, or add a
`"typecheck": "tsc --noEmit"` script to `apps/web/package.json` and call
`npm run typecheck`.

**5. Get `main` to lint-clean.**
Escape the 10 JSX apostrophes, then address the 2 `set-state-in-effect` errors
deliberately.

**6. Make the missing Convex URL fail loudly.**
Have `providers.tsx` throw a descriptive error at startup instead of silently
omitting `ConvexProvider`, so the failure names the missing variable rather
than surfacing as a prerender crash in `/forms/i-130/beneficiary`.

**7. Give the cleanup agent a runnable environment, or pause it.**
Its Playwright and manual-verification steps have never once executed. Either
provision Convex credentials plus `playwright install chromium`, or drop those
steps from the prompt. As configured, a daily run can only regenerate the
duplicates catalogued in section 2.2.

**8. Extend `.gitignore`.**
Add `test-results/`, `playwright-report/`, `*.log`, and `package-lock.json`.

**9. Delete the root `main.py` stub.**
