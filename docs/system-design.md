# FastRev — System Design

## Component responsibilities

- Client pages: Login, Register, Dashboard, Generate, DeckDetail.
- Client components: layout, auth forms, deck cards, flashcard editors, study card.
- Server routes/controllers: auth, generate, decks.
- Services: aiService, provider adapters, cooldown manager.
- Models: User, Deck, Card, Generation.
- Middleware: auth, rate limit, error handler, request logger.

## Request/response boundaries

- All API responses JSON. Errors: `{ error: { code, message } }` with appropriate HTTP status.
- Auth: `Authorization: Bearer <jwt>`.

## API endpoint design

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/generate (auth)
- GET /api/decks (auth)
- POST /api/decks (auth)
- GET /api/decks/:id (auth)
- DELETE /api/decks/:id (auth)
- GET /api/health

## Authentication flow

Register -> hash password -> store user -> login -> issue JWT -> client stores token -> requests include Bearer token -> middleware verifies -> attaches req.user.

## AI generation lifecycle

1. Auth check.
2. Validate body/material (non-empty, <=20,000).
3. Rate-limit checks.
4. Create reserved Generation record.
5. Call aiService.generate(material).
6. On success: update record completed (provider, cardCount, latencyMs); return cards + provider metadata.
7. On failure: update record failed (error safe); return 503 (provider chain) or appropriate status.

## Provider failover lifecycle

For each provider in order (Groq, Cerebras, Gemini):
- Skip if no key configured.
- Skip if cooling down (no request).
- Attempt with 15s timeout.
- On 429: set 60s cooldown; advance.
- On non-429 error: advance (no cooldown).
- On malformed/empty output: advance.
- On success: return normalized cards.
If none succeed: throw classified "all providers failed" -> 503.

## Cooldown behavior

- Per provider, 60s from 429. Injectable clock for tests. Independent tracking. Resets on process restart.

## Generation ledger lifecycle

- reserved on request start; completed/failed on outcome. Never store full source material or generated content. Store provider, status, cardCount, latencyMs, safe error.

## MongoDB schema design

See docs/architecture.md models. Indexes: User.email unique; Deck.userId; Card.deckId, Card.userId; Generation.userId.

## Index strategy

- Avoid redundant indexes where compound indexes suffice. Add compound indexes if query patterns require (e.g., Card { deckId, userId }).

## Authorization and ownership rules

- Every data query scoped by authenticated userId.
- Return 404 for non-owned/missing resources (no existence leak).
- Never trust client-supplied userId.

## Error response conventions

- 400 invalid input; 401 auth; 413 oversized; 429 app rate limit; 503 provider chain failure; 500 unexpected.
- Upstream 429 never surfaced as app 429; mapped to 503 or fallback.

## Environment variables

Server: MONGO_URI, JWT_SECRET, FRONTEND_ORIGIN, GROQ_API_KEY, CEREBRAS_API_KEY, GEMINI_API_KEY, PORT.
Client: VITE_API_URL.

## Rate-limiting rules

- 1 gen/user/5s; 30 gen/user/hour; optional 10 auth requests/IP/15min.
- Anti-abuse, not quotas.

## Test scenarios

See master prompt Phases 4,5,6,10.

## Deployment architecture

- Frontend Vercel (SPA routing), backend long-running Node host, DB Atlas.
- Health endpoint for checks. Graceful shutdown optional.<|end|><|start|>write to=assistant<|channel|>analysis<|message|>Created file successfully: docs/system-design.md