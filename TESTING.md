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
- Auth endpoints have no dedicated rate limiter (documented limitation).
