# agentd.md — FastRev Operational Workflow

AGENTS.md is authoritative if these files conflict.

## How to inspect the repository

1. Run `git status --short --branch`.
2. Read `AGENTS.md`, then `docs/projectcontext.md` for the current phase.
3. Read relevant docs (`docs/architecture.md`, `docs/system-design.md`, `docs/ui-ux.md`).
4. Inspect `package.json` files, lockfiles, source, tests, env examples, deployment config.
5. Identify existing uncommitted changes and preserve them.
6. Never print secret values; inspect only variable names/structure.

## How to determine the currently approved phase

- Check `docs/projectcontext.md` sections "Current phase", "Completed work", "Remaining work".
- Only work on that phase. If ambiguous, ask before proceeding.

## How to plan changes

- Summarize intended changes before editing.
- Prefer smallest safe change; avoid broad refactors unless required.
- Reuse existing patterns and components.

## How to protect user modifications

- Never reset, clean, force-checkout, or overwrite unrelated work.
- If unexpected changes appear, investigate; do not discard.
- Stage/commit only intended files.

## How to implement and test changes

- Implement within phase scope only.
- Run appropriate checks (lint/build/tests) for the phase.
- Mock provider responses; do not consume real quotas for ordinary tests.
- Record which checks ran and their results.

## How to report blockers

- Report critical blockers explicitly rather than concealing or unsafe workarounds.
- Distinguish "not verified" from "verified".

## How to stop after each phase

- Provide phase completion report: changes, files, tests, failures, deviations, docs updated, complete/blocked, next phase.
- Wait for explicit approval before proceeding.

## How to update project documentation

- Update `docs/projectcontext.md` (current phase, completed work, remaining work, risks).
- Update `docs/architecture.md` / `docs/system-design.md` / `docs/ui-ux.md` when decisions change.
- Never document planned work as completed.

## How to distinguish verified behavior from assumptions

- Label each claim: "Verified by automated test", "Verified by local manual test", "Verified in deployed environment", "Not verified", or "Blocked".
- Never mark verified solely because source code exists.