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

Phase 1 — Project foundation and design system (complete, pending approval to proceed).

## Completed work

- Phase 0: repository audit, documentation, baseline structure.
- Phase 1: frontend (React + Vite + Tailwind + shadcn/ui foundation, routing, app shell, design tokens, API client) and backend (Express app factory, env config, Mongoose connection, CORS, JSON parsing, health endpoint, not-found, centralized error handler, request logger).

## Remaining work

- README.md, .gitignore, minimal config files, validation of Phase 0.
- All feature phases 1–12.

## Known risks and blockers

- No git user configured globally (set local config).
- Provider model IDs and current APIs must be verified via official docs before Phase 4.
- Free-tier availability and hosting terms may change.