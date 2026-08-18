# CLAUDE.md — Scriptica prototype

This file is the entry point for Claude Code. Before making any change, read these files completely and treat them as repository instructions:

1. `AGENTS.md` — binding product, UX, architecture, verification, Git and deployment rules.
2. `docs/CODEX_HANDOFF.md` — current product state, decisions, known gaps and recommended next work.
3. `docs/ARCHITECTURE.md` — module boundaries, globals, persistence and fragile couplings.
4. `DESIGN_SYSTEM.md` — visual language; the real components and tokens in code still win if documentation drifts.
5. `docs/DEPLOYMENT.md` — read only when Vlad explicitly asks for a deployment.

## Current source of truth — 2026-08-18

- Development continues on `audit-vertical`; `main` is the frozen pre-audit rollback baseline. Never merge into, reset, or develop from `main` unless Vlad explicitly changes that policy.
- The production app at `https://scriptica.vandrus.dev` was previously deployed from a dirty workspace. That exact live application state has now been reconciled into Git and pushed to `origin/audit-vertical` as part of the Claude handoff.
- Production deploys are manual and explicit-request-only. A GitHub push does not deploy the site.
- This is a static, high-fidelity Romanian prototype: no framework, build step, backend, real authentication or real AI. Demo credibility and persona isolation matter more than production scalability.
- User-visible copy is Romanian with correct diacritics. Reuse the established components and design tokens; “codul câștigă” when a brief conflicts with the implemented design system.
- Client category, contracted verticals, per-account terminology and Acasă are separate concepts. `moduleAssignments[]` is only a legacy property name for per-client vertical assignments.
- Deactivating a vertical hides its working surfaces but never deletes its records, documents, annex responses, archive, terminology or saved dashboard layout.

## Start-of-session checklist

1. Run `git status -sb` and `git fetch origin` before editing. Preserve any changes you did not create.
2. Confirm the current branch is `audit-vertical` or a branch cut from it.
3. Read the relevant page script plus `js/mock-data.js` and `js/shell.js` couplings before changing data, navigation or persona behavior.
4. After UI work, serve the app locally, inspect the affected pages visually, check console errors, test `complet` plus every affected persona, and check a narrower viewport.
5. Run `node --check` on every changed JavaScript file. For shared JS/CSS, bump every matching `?v=` reference before deployment.

Do not deploy, push, create a PR, or change production settings unless Vlad explicitly asks for that action in the current conversation.
