# FastRev — Project Context

## Project overview

FastRev is an AI-powered educational flashcard web application (MERN). Students transform study material into organized Q&A flashcards using AI, review/edit them, and explicitly save decks.

## Problem statement

Students struggle to convert notes into study-ready flashcards efficiently. Manual creation is time-consuming; AI can assist but must not silently persist unreviewed content.

## Proposed solution

A web app where users paste material, generate flashcards via a fallback-capable AI provider chain, review/edit/remove cards, then explicitly save a deck. Decks persist in MongoDB and can be studied later.

## Target users

Students and self-learners.

## Functional requirements

- Register/login with email+password.
- Generate flashcards from pasted material (max 20,000 chars).
- Provider fallback: Groq -> Cerebras -> Gemini, with 60s cooldown on 429.
- Review/edit/remove generated cards; deck title; explicit save.
- Deck CRUD (list, read, delete) scoped to owner.
- Study view: question shown, answer revealed on interaction.
- Dashboard with decks, counts, empty state, deletion confirmation.

## Non-functional requirements

- Secure auth, ownership enforcement, safe errors, no secret leakage.
- Responsive, accessible, reduced-motion support.
- Honest messaging about free-provider availability; no daily quota claims.

## Technology stack

See AGENTS.md / docs/architecture.md.

## Product limitations

- Free-tier provider availability varies and may change.
- 60s cooldown does not replenish provider allowances.
- In-memory cooldown/rate limits are single-instance.
- No spaced repetition, analytics, collaboration (out of scope).

## Required features

Phases 0–12 as defined in the master prompt.

## Explicit exclusions

- No quota/daily usage enforcement or quota collection.
- No spaced repetition, analytics, collaborative decks.
- No TypeScript.
- No second frontend framework.

## Development phases

0 Repository audit, documentation, file structure (CURRENT).
1 Project foundation and design system.
2 Database models and validation.
3 Authentication and authorization.
4 AI provider adapters and fallback engine.
5 Generation endpoint and ledger.
6 Deck management API.
7 Frontend authentication and dashboard.
8 Generation and review interface.
9 Deck study experience.
10 Testing, accessibility, security hardening.
11 Deployment preparation.
12 Final acceptance and handover.

## Acceptance criteria

See master prompt Phase 12.

## Current phase

Phase 10 - Final release readiness, visual QA, and deployment preparation (in progress).

## Completed work

- Phase 0: repository audit, documentation, baseline structure.
- Phase 1: frontend (React + Vite + Tailwind + shadcn/ui foundation, routing, app shell, design tokens, API client) and backend (Express app factory, env config, Mongoose connection, CORS, JSON parsing, health endpoint, not-found, centralized error handler, request logger).
- Phase 2: database models (User, Deck, Card, Generation) with validation, trimming, length constraints, relationships, and indexes; automated model tests using mongodb-memory-server (42 tests passing).
- Phase 3: authentication and authorization (POST /api/auth/register, POST /api/auth/login, GET /api/auth/me) with bcryptjs password hashing (rounds = 10), JWT token issuance/verification, authorization middleware (`authenticate`), email normalization, generic authentication error handling, and 29 automated tests (71 total tests passing).
- Phase 4: AI provider adapters (Groq, Cerebras, Gemini) adhering to a common interface, centralized FallbackEngine with strict Groq -> Cerebras -> Gemini priority, in-memory CooldownManager (60s on 429), timeout handling via AbortController (15s default), bounded retries for transient errors, flashcard response parsing/validation (`parseFlashcards`), and 47 automated unit/integration tests (118 total tests passing).
- Phase 5: protected generation endpoint (`POST /api/generate`), request validation (max 20,000 chars material, title, card count), Generation ledger lifecycle (`reserved` -> `completed`/`failed`), Deck and Card persistence with compensating cleanup on partial failures, in-memory rate limiting (1 request per 5 seconds and 30 per rolling hour per user), error sanitization (no secret leakage), and 18 automated integration tests (136 total tests passing).
- Phase 6: deck management API (`GET /api/decks`, `POST /api/decks`, `GET /api/decks/:id`, `DELETE /api/decks/:id`) with strict user ownership scoping, cardCount aggregation, non-leaking 404 responses, associated card cleanup on deletion, input validation (1–120 char title), compensating failure handling for non-transactional deletion, and 30 automated integration tests (166 total tests passing).
- Phase 7-9: frontend authentication, dashboard, generation, and deck study experience implemented (Landing, Login, Register, Dashboard, Generate, DeckDetail, protected routes, API client, responsive header/mobile nav).
- Phase 10 (in progress): baseline verification, visual/accessibility/security/deployment review; contrast adjustment, accessibility labels, DB connection robustness, documentation.

## Remaining work

- Configure production environment variables and MongoDB Atlas without committing secrets.
- Complete a deployed smoke test for authentication, generation, studying, deck deletion, and not-found handling.
- Review release changes and close documented security/accessibility limitations as appropriate.

## Known risks and blockers

- Authentication endpoints do not currently have a dedicated rate limiter.
- JWTs are stored in browser local storage; this retains the documented XSS trade-off.
- Production environment configuration and deployed smoke tests have not been verified.
- Free-tier provider availability and hosting terms may change.