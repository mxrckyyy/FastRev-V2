# FastRev

AI-powered educational flashcard web application (MERN). Students paste study material, generate question/answer flashcards via an AI provider chain with automatic fallback, review and edit them, then explicitly save them as a deck.

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB (Atlas for production; mongodb-memory-server for tests)

## Repository structure

See `docs/architecture.md`. Baseline layout:

```
fastrev/
├── AGENTS.md
├── agentd.md
├── docs/
├── client/        # React + Vite frontend
└── server/        # Express + Mongoose backend
```

## Planned development phases

See `docs/projectcontext.md`. Current phase: Phase 0 (repository audit, documentation, file structure).

## Local development setup

Not yet available; feature implementation begins in Phase 1. Setup instructions will be added as phases complete.

## Environment configuration

Server (planned): `MONGO_URI`, `JWT_SECRET`, `FRONTEND_ORIGIN`, `GROQ_API_KEY`, `CEREBRAS_API_KEY`, `GEMINI_API_KEY`, `PORT`.
Client (planned): `VITE_API_URL`.

`.env.example` files will be added with Phase 1/11.

## Testing commands

To be established with Phase 1+.

## Deployment overview

Frontend: Vercel. Backend: long-running Node host. Database: MongoDB Atlas. Details in Phase 11.

## Documentation links

- `AGENTS.md` — coding-agent instructions.
- `agentd.md` — operational workflow.
- `docs/ui-ux.md` — UI/UX spec.
- `docs/architecture.md` — architecture.
- `docs/projectcontext.md` — requirements and status.
- `docs/system-design.md` — system design.