# FastRev CI Failure Investigation Report

## 1. Initial Git Branch and Status

- **Branch**: `main`
- **Status at start**: Modified tracked files from prior phases plus untracked reports/tests/baselines. No reset or cleanup performed.
- **Latest commit**: `f5c9504` — " phase 6.4"

## 2. GitHub Actions Run and Job IDs Inspected

- Run ID: `43832187696`
- Run URL: https://github.com/mxrckyyy/FastRev-V2/actions/runs/43832187696
- Backend Tests job: `133179916054` — FAILED
- Playwright E2E Tests job: `133179916304` — FAILED
- Frontend Build job: `133179916460` — PASSED

Job metadata was retrieved via the public GitHub REST API. Step-level data showed:
- Backend failure occurred in `Run backend tests` after ~8 seconds.
- Playwright failure occurred in `Run Playwright E2E tests` after browser installation succeeded.

## 3. Whether Actual Remote Logs Were Accessible

- GitHub CLI (`gh`) is **not installed** in this environment.
- Unauthenticated requests to job log endpoints returned **403**.
- Check-run annotations only contained generic `Process completed with exit code 1.` messages.
- Therefore, the exact remote stack traces were **not accessible**. Root causes were identified through local reproduction and code inspection.

## 4. Exact Backend Failure and Root Cause

### Observed locally with Node.js 20

Reproducing the backend suite under Node.js 20 (matching CI) produced one failure:

- Test: `tests/middleware/auth.test.js` — `rejects expired token`
- Expected: `Token has expired`
- Received: `Invalid token`

### Root cause

CI sets `JWT_SECRET` before starting tests. The test file sets `process.env.JWT_SECRET` after ESM imports have already evaluated `src/config/env.js`, so `env.jwtSecret` captured the CI secret. `src/utils/jwt.js` preferred `env.jwtSecret` over the overridden `process.env.JWT_SECRET`, causing signature verification to use the wrong secret. Locally, `JWT_SECRET` is usually unset, so `env.jwtSecret` is empty and the fallback to `process.env.JWT_SECRET` works.

### Fix

Changed `getSecret()` in `server/src/utils/jwt.js` to prefer `process.env.JWT_SECRET` over the cached `env.jwtSecret`.

## 5. Exact Playwright Failure and Root Cause

### Likely root cause (inferred; remote logs unavailable)

Visual regression baselines were generated on Windows and named with the platform/browser suffix (e.g. `landing-desktop-chromium-win32.png`). CI runs on `ubuntu-latest`, where Playwright expects `chromium-linux` baselines. Even though Windows baselines were committed, the Linux-specific baseline files would be missing, causing visual regression tests to fail.

### Fix

- Updated `client/playwright.config.js` with a platform-independent `snapshotPathTemplate`:
  `{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}{ext}`
- Renamed all 12 baseline files to remove the `-chromium-win32` suffix.
- Centralized screenshot comparison defaults in the Playwright config.

This makes the same baseline files usable across Windows and Linux.

## 6. Whether the Failures Share a Cause

The failures are **independent**:
- Backend: JWT secret resolution/environment interaction.
- Playwright: visual baseline platform mismatch.

## 7. Files Created and Modified

### Modified

| File | Change |
|------|--------|
| `server/src/utils/jwt.js` | Prefer `process.env.JWT_SECRET` over cached env secret |
| `client/playwright.config.js` | Added platform-independent snapshot path and screenshot defaults |
| `client/e2e/visual.spec.js-snapshots/*` | Renamed 12 baselines to platform-independent names |

No backend tests or visual assertions were weakened.

## 8. Fixes Implemented and Why

- `server/src/utils/jwt.js`: fixes secret resolution so tests overriding `JWT_SECRET` after import work consistently in CI and locally.
- `client/playwright.config.js`: removes OS/browser-specific baseline filenames so committed baselines work on Linux CI.
- Baseline rename: aligns existing baselines with the new snapshot path template.

## 9. Local Verification Commands

```bash
# Backend (Node 20 to match CI)
cd server
JWT_SECRET=ci-test-jwt-secret-not-for-production NODE_ENV=test npm test

# Frontend build
cd client
npm run build

# Full Playwright suite
cd client
npx playwright test

# YAML validation
cd server
node -e "const y=require('js-yaml'); const fs=require('fs'); const d=y.load(fs.readFileSync('../.github/workflows/ci.yml','utf8')); console.log('YAML_OK jobs:', Object.keys(d.jobs).join(', '))"

# Whitespace check
git diff --check
```

## 10. Actual Test Results

- Backend: **166 passed, 0 failed** (13 suites)
- Playwright: **64 passed, 0 failed, 0 skipped**
  - Existing E2E: 43
  - Accessibility: 9
  - Visual regression: 12
- Frontend build: **Pass**
- YAML validation: **Valid**
- `git diff --check`: **No whitespace errors**

## 11. Remaining Warnings or Limitations

- Remote GitHub Actions logs were inaccessible, so the Playwright failure root cause is inferred rather than confirmed from CI output.
- Visual baselines were not manually visually reviewed.
- Cross-platform rendering differences may still require threshold tuning on Linux CI.
- Node.js 20 deprecation warnings in GitHub Actions are environmental and do not affect test execution.

## 12. Final Git Status

- **Branch**: `main`
- **Status**: Modified tracked files plus untracked report/baselines. No commits, pushes, or deployments performed.

## 13. Exact Instructions for the User to Review, Commit, and Push

1. Review `git diff` and the renamed baseline files.
2. Confirm the JWT change and snapshot path change.
3. Stage and commit the changes.
4. Push to `main`.
5. Monitor the next GitHub Actions run.

## 14. What Must Be Verified in the Next GitHub Actions Run

- Backend Tests job passes all 166 tests.
- Playwright E2E Tests job passes all 64 tests, including visual regression on Linux.
- Frontend Build job remains passing.
- No new secret exposure or deployment changes.