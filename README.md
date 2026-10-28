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

## Project status

Frontend authentication, dashboard, flashcard generation, and deck study flows are implemented. The project is in Phase 10: release-readiness verification. See `docs/projectcontext.md` and `docs/release-readiness.md` for current status and known deployment requirements.

## Local development setup

Frontend:
```
cd client
npm install
npm run dev
```
Runs on http://localhost:5173.

Backend:
```
cd server
npm install
npm run dev
```
Runs on http://localhost:5000 (or PORT). Set environment variables in server/.env (see .env.example).

Health check: GET http://localhost:5000/api/health

## Environment configuration

Server: `MONGO_URI`, `JWT_SECRET`, `FRONTEND_ORIGIN`, optional provider keys (`GROQ_API_KEY`, `CEREBRAS_API_KEY`, `GEMINI_API_KEY`), and `PORT`. See `server/.env.example`.
Client: `VITE_API_URL`. See `client/.env.example`.

Do not commit real credentials. AI provider keys must remain server-side.

## Testing commands

Run the backend Jest and Supertest suite:
```
cd server
npm test
```

Create a production frontend build:
```
cd client
npm run build
```

## Deployment overview

Frontend: Vercel. Backend: long-running Node host. Database: MongoDB Atlas. Deployment still requires production environment variables and a manual smoke test; see `docs/release-readiness.md`.

## Documentation links

- `AGENTS.md` — coding-agent instructions.
- `agentd.md` — operational workflow.
- `docs/ui-ux.md` — UI/UX spec.
- `docs/architecture.md` — architecture.
- `docs/projectcontext.md` — requirements and status.
- `docs/system-design.md` — system design.
- `docs/release-readiness.md` — Phase 10 verification and deployment checklist.