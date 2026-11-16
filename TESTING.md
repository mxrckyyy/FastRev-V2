# FastRev Testing Guide

## Available Test Commands

### Backend Tests

From the `server/` directory:

```bash
npm test
```

Runs the full Jest test suite (166 tests across 13 suites) using `mongodb-memory-server` for database isolation. No external MongoDB or AI provider keys required.

### Frontend Production Build

From the `client/` directory:

```bash
npm run build
```

Creates an optimized production build using Vite. Fails on syntax or import errors.

### Complete CI Check (Local)

Run both checks in sequence:

```bash
cd server && npm test
cd ../client && npm run build
```

## Test Environment Isolation

- **Database**: Tests use `mongodb-memory-server` (in-memory MongoDB). No production database is accessed. Each test suite calls `connectTestDb()` in `beforeAll` and `clearTestDb()` in `beforeEach` for isolation.
- **AI Providers**: All AI provider tests use mocked responses. No real API calls are made during testing. The generation endpoint tests mock the AI service.
- **JWT Secret**: Tests set `process.env.JWT_SECRET` in test files. No production secret is required.
- **Rate Limiter**: In-memory per-process. Resets between test runs.

## GitHub Actions CI

The workflow is defined in `.github/workflows/ci.yml`.

**Triggers:**
- Push to `main`
- Pull request targeting `main`

**Jobs:**
1. **Backend Tests**: Runs `npm ci` and `npm test` in `server/`. Sets `JWT_SECRET` to a test-only value. Timeout: 15 minutes.
2. **Frontend Build**: Runs `npm ci` and `npm run build` in `client/`. Timeout: 10 minutes.

**Permissions:** `contents: read` (least privilege).

**Caching:** npm dependencies are cached using `actions/setup-node` with `cache: npm`.

**Failure behavior:** If either job fails, the workflow fails and the PR cannot be merged (if branch protection is enabled).

## Interpreting Failures

- **Backend test failure**: Check the test name and assertion. Common causes: schema validation changes, missing env vars, MongoDB connection issues.
- **Frontend build failure**: Check for syntax errors, missing imports, or TypeScript (not applicable) errors. Vite will report the file and line.
- **npm ci failure**: Usually means `package-lock.json` is out of sync with `package.json`. Run `npm install` locally and commit the updated lockfile.

## Tests Using Mocked AI Responses

All AI-related tests use mocked provider responses:
- `tests/ai/providers.test.js` — Mocks fetch for Groq, Cerebras, Gemini
- `tests/ai/fallbackEngine.test.js` — Mocks provider adapters
- `tests/ai/responseParser.test.js` — Pure unit tests, no network
- `tests/ai/cooldownManager.test.js` — Pure unit tests, no network
- `tests/generate/generate.test.js` — Mocks `aiService.generateFlashcards`

No real AI provider API calls are made during testing.

## Manual Verification Still Required

The following cannot be automated and require manual verification:
- Browser-based visual inspection (layout, spacing, colors)
- Responsive design at various viewport sizes
- Accessibility with screen readers
- Mobile touch interactions
- Dark mode appearance (CSS tokens defined, no toggle yet)
- Production deployment smoke test
- AI generation with real providers (requires API keys)

## Known Limitations

- CI uses Node.js 20. The project requires Node.js 20+ (per README).
- `mongodb-memory-server` downloads a MongoDB binary (~600MB) on first run. Subsequent runs use the cache.
- The workflow does not run lint checks (no lint script defined in package.json).
- The workflow does not run frontend tests (no test script defined in client package.json).

## Playwright E2E Tests

### Prerequisites

From the `client/` directory, install dependencies and browser binaries:

```bash
npm ci
npx playwright install chromium
```

In CI, browser system dependencies are installed with:

```bash
npx playwright install --with-deps chromium
```

### Running E2E Tests

All E2E tests:

```bash
cd client
npm run test:e2e
```

Single spec file:

```bash
cd client
npx playwright test e2e/auth.spec.js
```

Single test by title:

```bash
cd client
npx playwright test --grep "login form renders with required fields"
```

Headed (visible browser):

```bash
cd client
npm run test:e2e:headed
```

Playwright UI mode:

```bash
cd client
npm run test:e2e:ui
```

### Reports and Traces

HTML report (after a run):

```bash
cd client
npx playwright show-report
```

Traces are captured on first retry (`trace: on-first-retry` in `playwright.config.js`). View a trace:

```bash
cd client
npx playwright show-trace test-results/<test-name>/trace.zip
```

Screenshots and videos are retained on failure under `client/test-results/`.

### API Mocking and Isolation

- E2E tests run against the Vite dev server only; no backend server or MongoDB is required.
- Browser network requests to `/api/...` are intercepted with `page.route(...)` and fulfilled with controlled JSON responses.
- Real AI providers, production MongoDB, and production credentials are never used.
- Authentication state is simulated by seeding `localStorage` (`fastrev_token`, `fastrev_user`) via `setAuthToken()` and mocking `/api/auth/me`.
- Each test sets up its own route handlers; handlers use `route.fallback()` so more specific mocks take precedence.
- Test data is defined in `client/e2e/fixtures.js` and is isolated per test.

### Covered Workflows

- Landing page load, navigation, primary CTA, mobile navigation.
- Registration form rendering, validation, duplicate-email error, successful redirect.
- Login form rendering, invalid credentials, password visibility toggle, successful redirect.
- Protected route redirect when unauthenticated.
- Dashboard loading, empty, populated, error, retry, delete success/failure.
- Generation form rendering, empty input rejection, character counter, over-limit warning, successful submission, loading state, API failure.
- Deck detail loading, populated, empty, not-found, study interactions (reveal/hide, next/previous/restart), navigation back, delete.
- Responsive navigation (mobile open/close, link click close, escape, desktop visibility, no horizontal overflow).

### Accessibility Tests

Run accessibility scans (axe-core, WCAG 2.1 AA tags):

```bash
cd client
npx playwright test accessibility
```

Accessibility violations are reported with rule IDs, descriptions, affected selectors, and failure summaries.

### Visual Regression Tests

Run visual regression tests:

```bash
cd client
npx playwright test visual
```

Baselines are stored under `client/e2e/visual.spec.js-snapshots/`. Differences produce actual/diff images under `client/test-results/`.

Update approved baselines only deliberately:

```bash
cd client
npx playwright test visual --update-snapshots
```

Review generated PNGs before committing baseline changes. CI does not update baselines automatically.

### Known Limitations

- E2E tests mock the API; they do not validate real backend behavior (covered by Jest integration tests).
- Only Chromium is configured for E2E tests.
- Tests rely on stable UI text/selectors; changes to copy may require test updates.
- Playwright browser download requires network access on first run.
- The E2E job does not start the backend server.
- Automated accessibility scans do not replace manual screen-reader or keyboard testing.
- Visual baselines are platform/browser specific and were generated on Windows Chromium; Linux CI may require baseline regeneration if rendering differs.
- Auth endpoints have no dedicated rate limiter (documented limitation).
