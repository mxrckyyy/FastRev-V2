# AGENTS.md — FastRev

## Project identity

FastRev is an AI-powered educational flashcard web application (MERN). Students paste study material, receive generated question/answer flashcards from an AI provider, review and edit them, then explicitly save them as a deck. AI assists creation; the student is responsible for accuracy. Review-before-save is mandatory; generated cards are never auto-saved.

## Required technology stack

- Frontend: React 18, Vite, JavaScript/JSX, React Router 6, Tailwind CSS, shadcn/ui, Aceternity UI (selective), Motion for React, GSAP (timeline-only), AutoAnimate (simple lists), lucide-react, native Fetch via shared API client.
- Backend: Node.js, Express.js, Mongoose, MongoDB, bcryptjs, jsonwebtoken, express-rate-limit, dotenv, cors, Jest + Supertest + mongodb-memory-server.
- Database: MongoDB Atlas (prod), mongodb-memory-server (tests). Collections: users, decks, cards, generations. No quota collection.
- AI providers (priority order): 1 Groq, 2 Cerebras, 3 Gemini (free tiers only).
- Hosting: Vercel (frontend), Render/Railway/Fly.io (backend), MongoDB Atlas (db).

## Repository safety rules

- Inspect the repo and read AGENTS.md + relevant docs before any task.
- Run `git status --short --branch` before modifying.
- Preserve existing user changes; never reset/clean/force-checkout/overwrite unrelated work.
- Do not replace a working app with a new scaffold without explicit approval.
- If the repo is empty, use the documented baseline structure.
- If an existing implementation conflicts with the plan, report the conflict and propose the smallest safe migration.
- Work only on the currently approved phase; stop after each phase and wait for approval.

## JavaScript-only rule

Use JavaScript and JSX only. Do not introduce TypeScript unless explicitly approved.

## Security requirements

- JWT secrets and provider keys stay on the server only.
- Never expose provider keys in `VITE_` variables or frontend bundles.
- Never trust a client-supplied user ID; derive identity from the verified JWT.
- All deck/card queries scoped by authenticated user ID; return 404 for non-owned resources.
- Hash passwords with bcryptjs; never return password hashes.
- JWTs signed with expiry; validate signature and expiry in middleware.
- CORS restricted to configured frontend origin.
- Request body size limits; safe public error messages; no logging of study material/generated content/secrets.
- No unprotected deck endpoints.

## Code organization conventions

- Modular, readable JS; single-responsibility modules; avoid duplicated business logic.
- Reusable components; no copy-pasted page implementations.
- Shared API client in `client/src/lib/api.js`.
- Backend: `app.js` (app creation) separated from `server.js` (startup) for testability.
- Provider adapters under `server/src/services/ai/`.
- Consistent JSON error format.

## Testing expectations

- Jest + Supertest + mongodb-memory-server.
- Mock provider responses; do not consume real free-tier quotas for ordinary failover tests.
- Distinguish unit/integration/build/mocked/manual/deployed verification; never claim a test passed unless executed and inspected.
- Report skipped tests and unavailable services explicitly.
- Do not weaken tests to make them pass.

## UI/UX rules

- Calm, academic productivity aesthetic; avoid generic AI-template look.
- Responsive desktop/tablet/mobile; no horizontal overflow; no clipped dialogs.
- Accessible labels, keyboard navigation, visible focus, readable contrast.
- Loading, empty, error, success states for async flows.
- Review-and-edit is mandatory; never auto-save generated cards.
- No dead buttons, placeholder routes presented as finished, or hardcoded success responses.

## Animation library usage rules

- CSS transitions: basic hover/focus.
- shadcn/ui: accessible controls and its own interaction behavior.
- Motion for React: ordinary UI animation (route/dialog/card entrance, reduced-motion aware).
- GSAP: exceptional timeline-based sequences only; clean up on unmount; Strict Mode compatible.
- AutoAnimate: simple list add/remove/reorder only.
- Aceternity UI: selective visual enhancements on marketing/hero sections.
- Never animate the same property on the same element with multiple systems.
- Honor `prefers-reduced-motion`; app usable if decorative animation disabled.
- Document exact usage in `docs/ui-ux.md`.

## Phase boundaries

- Work only on the approved phase; do not begin subsequent phases automatically.
- Complete implementation + checks + docs; provide phase completion report; stop and wait for explicit approval.
- Report critical blockers rather than concealing them.
- Approval of one phase is not approval of all.

## Documentation maintenance

- Keep docs synchronized with actual implementation.
- Update docs when architectural decisions change.
- Never document planned functionality as completed.
- Primary reference files: `AGENTS.md`, `agentd.md`, `docs/*.md`, `README.md`.

## Honesty about verification

- Never claim a test passed unless executed and result inspected.
- Never claim manual testing or deployment verification without evidence.
- Distinguish verification types in reports.
- Do not invent provider capabilities, model IDs, API limits, or deployment features; verify via official docs.

## Instruction to future tasks

Before starting any task, inspect the repository and read `AGENTS.md` and the relevant files under `docs/`. Confirm the currently approved phase from `docs/projectcontext.md`.