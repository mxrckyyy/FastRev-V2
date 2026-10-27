# FastRev — Architecture

## MERN architecture

Client (React/Vite) communicates with an Express REST API over HTTPS. Express connects to MongoDB via Mongoose. AI providers are called only from the backend.

## Client-server boundaries

- Frontend never holds provider keys or JWT secrets.
- Frontend calls `/api/*` via shared API client (`client/src/lib/api.js`).
- Backend is the sole owner of auth, AI orchestration, persistence, and rate limiting.

## Frontend responsibilities

- Rendering, routing, form validation (UX-level), auth state, API calls, review/edit UX, study view.
- No business-critical validation only on client; server re-validates.

## Backend responsibilities

- Authentication/authorization, request validation, AI provider orchestration + fallback, cooldown management, generation ledger, deck/card CRUD, rate limiting, error handling.

## API client

- Native Fetch wrapper with base URL from `VITE_API_URL`, JSON handling, auth header injection, consistent error parsing.

## Authentication middleware

- Reads `Authorization: Bearer <token>`, verifies JWT signature + expiry, derives user ID from token, attaches to `req.user`. Never trusts client-supplied user ID.

## AI service architecture

- Centralized under `server/src/services/ai/`.
- Provider adapter pattern: each provider (Groq, Cerebras, Gemini) implements a common interface: `generate(material)` -> normalized cards or throws classified error.
- `aiService.js` orchestrates fallback order, cooldown checks, timeouts, normalization, validation.
- Response normalization converts provider-specific output to `{ question, answer }[]`.
- Output validation: JSON parse, schema check, reject empty/malformed, strip Markdown fences.

## Provider adapter pattern

- Each adapter encapsulates request format, headers, model ID, response extraction.
- Common error classification: 429 rate limit vs other errors vs timeout vs malformed.

## Provider fallback order

1. Groq
2. Cerebras
3. Gemini

Only providers with configured keys are attempted. Skip cooling-down providers (no network request).

## Cooldown manager

- In-memory, per-provider, 60s after a 429.
- Injectable clock for deterministic tests.
- Independent tracking per provider.
- Process restart resets state; multi-replica = independent maps. Documented limitation. No Redis initially.

## Rate-limiting strategy

- Anti-abuse only, not daily quotas.
- 1 generation per user per 5s; 30 per user per hour; optional 10 per IP per 15min auth limiter.
- express-rate-limit with authenticated-user key after auth middleware.
- In-memory store initially; document multi-instance limitations.

## Mongoose models

- User: email (normalized lowercase, unique), passwordHash, timestamps.
- Deck: userId (indexed), title, timestamps.
- Card: deckId (indexed), userId (indexed), question, answer, timestamps.
- Generation: userId (indexed), provider, status (reserved/completed/failed), cardCount, latencyMs, error, timestamps.

## Database isolation

- mongodb-memory-server for tests; Atlas for prod. No cross-test leakage via fresh DB per test file/suite.

## Error handling

- Centralized Express error handler; consistent JSON `{ error: { code, message } }` (or similar). Safe public messages; no internals/secrets/material.

## Testing strategy

- Jest + Supertest + mongodb-memory-server.
- Unit: validation, normalization, fallback, cooldown, auth middleware, ownership helpers.
- Integration: auth, protected endpoints, generation validation/rate limits, provider switching, deck CRUD, cross-user isolation, ledger lifecycle.
- Mocked provider responses; no real quota consumption for ordinary tests.

## Deployment boundaries

- Frontend Vercel; backend long-running Node host; DB Atlas.
- Free tiers may change/sleep; document honestly.

## Environment configuration

- Server: MONGO_URI, JWT_SECRET, FRONTEND_ORIGIN, GROQ_API_KEY, CEREBRAS_API_KEY, GEMINI_API_KEY, PORT.
- Client: VITE_API_URL.
- `.env.example` files without real secrets.

## Architectural trade-offs

- In-memory cooldown/rate-limit: simple, single-instance; resets on restart; not shared across replicas. Acceptable for initial scope; Redis deferred.
- JWT in browser storage: XSS risk documented; HttpOnly cookie alternative requires CSRF changes — document before adopting.
- No daily quota: relies on provider capacity + anti-abuse limits; honest messaging.

## Phase 1 implementation notes

- Frontend entry: `client/src/main.jsx` -> `client/src/App.jsx` -> `client/src/app/router.jsx`.
- Backend entry: `server/src/server.js` -> `server/src/app.js` (`createApp`).
- Design tokens: CSS variables in `client/src/styles/index.css`; Tailwind config `client/tailwind.config.js`.
- shadcn/ui component source: `client/src/components/ui/`.
- Shared utilities: `client/src/lib/utils.js` (`cn`), `client/src/lib/api.js` (Fetch wrapper).
- Animation libraries: Motion (`motion`) installed for future use; GSAP and AutoAnimate deferred to later phases (not installed yet) to keep foundation lightweight. Aceternity UI components will be added selectively when needed.
- Environment validation warns on missing required variables and does not crash the process in development; production-critical missing variables fail startup in production.