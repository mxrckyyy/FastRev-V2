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

### Endpoints
- `POST /api/auth/register`:
  - Request body: `{ "email": "user@example.com", "password": "password123" }`
  - Validations: email presence, trimming, regex format `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, lowercased normalization. Password string between 8 and 128 characters.
  - Password hashing: `bcryptjs` with salt rounds = 10. Plaintext passwords never stored or logged.
  - Duplicate email handling: returns 409 Conflict `{ error: { code: "CONFLICT", message: "Email is already registered" } }`.
  - Response (201 Created):
    ```json
    {
      "user": {
        "id": "<user-id>",
        "email": "user@example.com",
        "createdAt": "2026-10-27T..."
      },
      "token": "<jwt-token>"
    }
    ```
  - Security: `passwordHash` is never exposed in response body.

- `POST /api/auth/login`:
  - Request body: `{ "email": "user@example.com", "password": "password123" }`
  - Normalization: email trimmed and lowercased.
  - Lookup: retrieves user and verifies password against `passwordHash` using `bcrypt.compare`.
  - Generic authentication errors: returns 401 Unauthorized `{ error: { code: "UNAUTHORIZED", message: "Invalid email or password" } }` for both unknown email and incorrect password (prevents account enumeration).
  - Response (200 OK):
    ```json
    {
      "user": {
        "id": "<user-id>",
        "email": "user@example.com",
        "createdAt": "2026-10-27T..."
      },
      "token": "<jwt-token>"
    }
    ```

- `GET /api/auth/me`:
  - Protected with `authenticate` middleware.
  - Header: `Authorization: Bearer <jwt-token>`
  - Response (200 OK):
    ```json
    {
      "user": {
        "id": "<user-id>",
        "email": "user@example.com",
        "createdAt": "2026-10-27T..."
      }
    }
    ```

### JWT configuration
- Secret read from environment variable `JWT_SECRET`. Throws error if not configured.
- Default expiration: `7d`.
- Token payload contains `{ userId: "<user_id>", email: "<email>" }`.

### Authentication middleware (`authenticate`)
- Verifies `Authorization: Bearer <token>` header.
- Rejects missing, malformed, invalid signature, or expired tokens with 401 Unauthorized.
- Sets `req.user = { userId: decoded.userId, email: decoded.email }`.
- Downstream endpoints derive caller identity exclusively from `req.user.userId`. Client-supplied user IDs in request bodies, query params, or route params are never trusted.

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
- Skip if no key configured (`isConfigured() === false`).
- Skip if cooling down (`isCoolingDown() === true`, no network request made).
- Attempt request with configurable timeout (default 15s via `AbortController`).
- Bounded retries: retry transient network/server failures up to `maxRetries` (default 1).
- Non-retryable errors (401/403 auth, 400 invalid request, safety blocks) fail fast to next provider without wasting retry budget.
- On 429 rate limit: set 60s cooldown; advance to next eligible provider.
- On malformed or empty output: advance to next eligible provider.
- On success: parse and validate flashcard structure via `parseFlashcards`.
- Return normalized `{ provider, model, latencyMs, cards }`.
If none succeed: throw classified `ProviderError` with code `ALL_PROVIDERS_FAILED` (mapped to 503 Service Unavailable in API layer).

## Cooldown behavior

- Per provider, 60s from 429 (configurable via `AI_COOLDOWN_MS`).
- In-memory `CooldownManager` with injectable clock for deterministic unit testing.
- Independent tracking per provider. Resets on process restart.

## AI response parsing and validation (`parseFlashcards`)

- Accepts JSON containing `cards: [...]`, `flashcards: [...]`, or direct array `[...]`.
- Strips markdown code fences (```` ```json ... ``` ```` or ```` ``` ... ``` ````).
- Enforces array bounds: 1 to 100 cards.
- Enforces field constraints matching Mongoose Card model:
  - `question`: string, trimmed, 1 to 2,000 characters.
  - `answer`: string, trimmed, 1 to 5,000 characters.
- Rejects missing, empty, or whitespace-only fields.
- Rejects non-object items or non-string values.
- Never fabricates cards and never writes to database.

## Provider adapters
- **Groq** (`groq.js`): OpenAI-compatible API at `https://api.groq.com/openai/v1/chat/completions`. Default model `llama-3.3-70b-versatile` (configurable via `GROQ_MODEL`).
- **Cerebras** (`cerebras.js`): OpenAI-compatible API at `https://api.cerebras.ai/v1/chat/completions`. Default model `llama3.1-8b` (configurable via `CEREBRAS_MODEL`).
- **Gemini** (`gemini.js`): REST API at `https://generativelanguage.googleapis.com/v1beta/models`. Default model `gemini-1.5-flash` (configurable via `GEMINI_MODEL`). Checks `promptFeedback.blockReason` and `candidate.finishReason === 'SAFETY'`.

## Error classifications (`ProviderError`)
- `PROVIDER_NOT_CONFIGURED`: Missing provider API key.
- `PROVIDER_AUTH_ERROR`: 401/403 or invalid API key.
- `PROVIDER_RATE_LIMIT`: 429 rate limit; triggers cooldown.
- `PROVIDER_TIMEOUT`: AbortError or deadline exceeded.
- `PROVIDER_NETWORK_ERROR`: Fetch network or DNS failure.
- `PROVIDER_SERVER_ERROR`: 5xx upstream server error.
- `PROVIDER_INVALID_REQUEST`: 400 bad request.
- `PROVIDER_INVALID_RESPONSE`: Malformed JSON or schema violation.
- `PROVIDER_SAFETY_BLOCK`: Content blocked by safety filter.
- `ALL_PROVIDERS_FAILED`: Fallback exhausted; safe summary details.

## Deck management API (`/api/decks`)

All deck management endpoints require a valid Bearer JWT via `authenticate` middleware. All operations are strictly scoped to the authenticated caller's identity (`req.user.userId`). Cross-user requests yield identical 404 responses to avoid existence leakage.

- **`GET /api/decks`**:
  - Lists all decks belonging to `req.user.userId`.
  - Ordered newest first (`createdAt: -1`).
  - Includes `cardCount` aggregated across cards belonging to that deck.
  - Excludes flashcard questions and answers for fast, light listing.
  - Response (200 OK):
    ```json
    {
      "decks": [
        {
          "id": "<deck-id>",
          "title": "Cellular Biology",
          "cardCount": 10,
          "createdAt": "2026-10-27T...",
          "updatedAt": "2026-10-27T..."
        }
      ]
    }
    ```

- **`GET /api/decks/:deckId`**:
  - Validates `deckId` as a valid MongoDB ObjectId (400 if malformed).
  - Retrieves deck only if owned by caller (`_id: deckId, userId: req.user.userId`); returns 404 if missing or owned by another user.
  - Retrieves all cards belonging to the deck and user (`deckId: deck._id, userId: req.user.userId`).
  - Response (200 OK):
    ```json
    {
      "deck": {
        "id": "<deck-id>",
        "title": "Cellular Biology",
        "cardCount": 2,
        "createdAt": "2026-10-27T...",
        "updatedAt": "2026-10-27T..."
      },
      "cards": [
        {
          "id": "<card-id>",
          "question": "What is RNA?",
          "answer": "Ribonucleic acid",
          "createdAt": "2026-10-27T..."
        }
      ]
    }
    ```

- **`PATCH /api/decks/:deckId`**:
  - Validates `deckId` as a valid ObjectId (400 if malformed).
  - Validates `title`: required string, trimmed, 1 to 120 characters. Rejects empty, whitespace-only, non-string, or >120 characters with 400 Bad Request.
  - Protected fields (`userId`, `_id`, timestamps) cannot be modified or reassigned.
  - Updates title only for caller's deck; returns 404 if missing or unauthorized.
  - Response (200 OK):
    ```json
    {
      "deck": {
        "id": "<deck-id>",
        "title": "Advanced Cellular Biology",
        "cardCount": 2,
        "createdAt": "2026-10-27T...",
        "updatedAt": "2026-10-27T..."
      }
    }
    ```

- **`DELETE /api/decks/:deckId`**:
  - Validates `deckId` as a valid ObjectId (400 if malformed).
  - Verifies ownership (`_id: deckId, userId: req.user.userId`); returns 404 if missing or unauthorized.
  - Deletes all associated cards (`Card.deleteMany({ deckId, userId })`) and the deck (`Deck.findByIdAndDelete(deckId)`).
  - Cards and decks belonging to other users remain completely unaffected.
  - Response (200 OK):
    ```json
    {
      "message": "Deck and associated cards deleted successfully",
      "deckId": "<deck-id>"
    }
    ```

## Generation endpoint (`POST /api/generate`)

- **Authentication**: Requires valid Bearer JWT via `authenticate` middleware. Identity derived solely from `req.user.userId`.
- **Rate limiting**: Enforced via `GenerationRateLimiter`:
  - 1 generation per 5 seconds per authenticated user (cooldown).
  - 30 generations per rolling 1 hour per authenticated user.
  - In-memory per-process storage; resets on process restart.
  - Returns 429 Too Many Requests with `Retry-After` header when limit is exceeded.
- **Request validation**:
  - `material`: Required string, trimmed, 1 to 20,000 characters.
  - `title`: Optional string, trimmed, 1 to 120 characters (defaults to `Study Deck - YYYY-MM-DD`).
  - `cardCount`: Optional integer between 1 and 50.
- **Persistence & Compensating Cleanup**:
  - Generation record created in `reserved` status before AI call.
  - Calls `aiService.generateFlashcards`.
  - On success: creates `Deck`, inserts `Card` records scoped to `userId` and `deckId`.
  - Compensating cleanup: if card persistence fails, partially created deck and cards are deleted before error response.
  - On success: marks `Generation` record `completed` with actual provider, cardCount, latencyMs.
  - On failure: marks `Generation` record `failed` with sanitized bounded error string (max 500 chars).
- **Response (201 Created)**:
  ```json
  {
    "deck": {
      "id": "<deck-id>",
      "title": "Study Deck - 2026-10-27",
      "cardCount": 5,
      "createdAt": "2026-10-27T..."
    },
    "cards": [
      { "id": "<card-id>", "question": "...", "answer": "..." }
    ],
    "generation": {
      "id": "<gen-id>",
      "provider": "groq",
      "latencyMs": 245
    }
  }
  ```

## Generation ledger lifecycle

- `reserved` on request start; `completed` or `failed` on outcome.
- Never stores full source material, AI prompts, or generated content.
- Stores `provider`, `status`, `cardCount`, `latencyMs`, and safe sanitized error.

## MongoDB schema design

### User
- `email`: required String, trimmed, lowercased, validated email format, unique index.
- `passwordHash`: required String, minlength 1.
- Timestamps enabled.
- Index: `{ email: 1 }` unique.

### Deck
- `userId`: required ObjectId ref `User`.
- `title`: required String, trimmed, minlength 1, maxlength 120.
- Timestamps enabled.
- Index: `{ userId: 1 }`.

### Card
- `deckId`: required ObjectId ref `Deck`.
- `userId`: required ObjectId ref `User`.
- `question`: required String, trimmed, minlength 1, maxlength 2000.
- `answer`: required String, trimmed, minlength 1, maxlength 5000.
- Timestamps enabled.
- Indexes: `{ deckId: 1, userId: 1 }`, `{ userId: 1 }`.

### Generation
- `userId`: required ObjectId ref `User`.
- `provider`: optional String, case-insensitive validation against `groq`, `cerebras`, `gemini`.
- `status`: required String, enum `reserved`, `completed`, `failed`, default `reserved`.
- `cardCount`: Number, default 0, min 0, integer.
- `latencyMs`: Number, min 0.
- `error`: optional String, trimmed, maxlength 500.
- Timestamps enabled.
- Index: `{ userId: 1 }`.

## Index strategy

- Avoid redundant indexes where compound indexes suffice. Add compound indexes if query patterns require (e.g., Card { deckId, userId }).
- User.email unique.
- Deck.userId.
- Card.deckId, Card.userId.
- Generation.userId.

## Authorization and ownership rules

- Every data query scoped by authenticated userId.
- Return 404 for non-owned/missing resources (no existence leak).
- Never trust client-supplied userId.

## Error response conventions

- 400 invalid input; 401 auth; 413 oversized; 429 app rate limit; 503 provider chain failure; 500 unexpected.
- Upstream 429 never surfaced as app 429; mapped to 503 or fallback.

## Environment variables

Server:
- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: Secret for signing access tokens.
- `FRONTEND_ORIGIN`: Allowed origin for CORS (e.g. `http://localhost:5173`).
- `GROQ_API_KEY`: Groq API key (optional if other providers used).
- `GROQ_MODEL`: Groq model (default `llama-3.3-70b-versatile`).
- `CEREBRAS_API_KEY`: Cerebras API key (optional).
- `CEREBRAS_MODEL`: Cerebras model (default `llama3.1-8b`).
- `GEMINI_API_KEY`: Google Gemini API key (optional).
- `GEMINI_MODEL`: Gemini model (default `gemini-1.5-flash`).
- `AI_PROVIDER_TIMEOUT_MS`: Request timeout (default `15000`).
- `AI_PROVIDER_MAX_RETRIES`: Max retries for transient errors (default `1`).
- `AI_COOLDOWN_MS`: Cooldown duration after 429 (default `60000`).
- `PORT`: HTTP port (default `5000`).

Client:
- `VITE_API_URL`: Backend base URL.

## Rate-limiting rules

- 1 gen/user/5s; 30 gen/user/hour; optional 10 auth requests/IP/15min.
- Anti-abuse, not quotas.

## Test scenarios

See master prompt Phases 4,5,6,10.

## Tests

- Run from `server/`: `npm test`.
- Uses `mongodb-memory-server`; no external MongoDB or provider keys required.
- Jest runs in ESM mode via `node --experimental-vm-modules`.
- Current coverage: 161 tests across 13 test suites:
  - Models: User (8), Deck (8), Card (14), Generation (12)
  - Auth: Register (11), Login (9), Middleware & JWT (9)
  - AI Service: Providers (13), FallbackEngine (8), ResponseParser (17), CooldownManager (9)
  - Generation: Endpoint & Rate Limiting (18)
  - Decks: Management API (25)

## Privacy constraints for Generation records

Generation records are observability only. They must never store pasted study material, raw prompts, generated Q/A content, API keys, JWTs, passwords/hashes, raw provider response bodies, or sensitive upstream error details.

## Deployment architecture

- Frontend Vercel (SPA routing), backend long-running Node host, DB Atlas.
- Health endpoint for checks. Graceful shutdown optional.