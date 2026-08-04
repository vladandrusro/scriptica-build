# AGENTS.md — Scriptica prototype

Instructions for AI coding agents (OpenAI Codex) working in this repository. Read this fully before making changes. Deeper references: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (how the code works), [docs/CODEX_HANDOFF.md](docs/CODEX_HANDOFF.md) (current state, debt, next tasks), [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md), [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

## Who you are working with

The repository owner (Vlad) is **the product owner and UX designer, not a software engineer**. This changes how you must communicate:

- Explain technical choices in **plain language**. Lead with what the user will see and experience, not with implementation vocabulary.
- **Never ask him to choose between technical implementations without explaining the visible product consequences, the risks, and the future costs of each option.** "Option A: the page updates instantly but edits are lost on reload; Option B: edits survive reload but adds a save step" — not "localStorage vs in-memory?".
- When he describes a problem or thinks out loud, give your assessment first; don't jump to changing code until he asks.
- He gives design direction in Romanian or English, often as briefs or mockups. Follow the brief's *intent*; where a brief conflicts with the real code's design system, **the code's existing components and tokens win** (this principle — "codul câștigă" — was established when a brief specified 10px card radii and the real `.card` component used the 16px token; the token won).

## What the product is

**Scriptica** is a Romanian-language workflow platform for accounting firms and public-sector audit teams. This repository is its **high-fidelity clickable prototype** — a static HTML/CSS/JS site with fake data — used for sales demos, internal design validation, and de-risking the real build (a separate production platform exists at app.scriptica.ro; it is reference-only and out of scope).

**Users it models:**
- Accountants at small firms managing many client companies ("situații contabile" — recurring monthly/quarterly accounting engagements).
- Public-institution internal auditors ("misiuni de audit" over primării, hospitals, county councils).
- The firm's clients (a simplified read-mostly portal view).
- Firm administrators (back-office configuration: users, engagement types, form templates).
- An internal "Autoritate Decidentă" (top-seniority approver of audit missions — deliberately internal, not external).
- Scriptica HQ itself (a "Super Admin" zone: commercial ops + a no-code registry that defines client types and flow verticals).

**The product problem it solves:** accounting/audit work is deadline-driven document flows spread across email, Excel and folklore. Scriptica's thesis is that **everything is a flow** ("totul este un flux"): a client type gets verticals, a vertical gets flow templates with steps, each step carries tasks, documents, form annexes (anexe) and a conversation — and one generic engine can serve any business vertical (accounting, audit, tax consulting, construction) that HQ configures, without new pages.

**Maturity:** advanced prototype, live at https://scriptica.vandrus.dev. Everything visual works and is demo-ready; there is no backend, no real auth, no real AI — data is mock, persistence is browser localStorage, "AI classification" results are seeded. Treat every feature as *demo-real*: it must look and behave convincingly in a walkthrough, and it does not need to survive production loads.

## Major user journeys (keep these working)

1. **Accountant**: Acasă dashboard → Situații table → open a situation → complete tasks + fill anexe → "Finalizează pasul" (gated on both) → step advances → documents auto-archive to Arhivă.
2. **Auditor**: Planificare (multiannual/annual plan) → "Demarează" pre-fills mission creation → mission workspace (objectives, Dosar Permanent, anexe with auto-formulas, Etapa IV recommendations) → send for approval.
3. **Autoritate**: sees missions "Spre Aprobare" read-only → Aprobă / Cere modificări / Respinge (the one decision that persists across reloads).
4. **Approved mission** → appears under the Rapoarte tab with the expandable AI-scored final report.
5. **Client**: logs into a scoped portal (Canvas S.R.L. only), sees friendly statuses and required actions.
6. **Scriptica HQ**: create the client type first (Accounting / Audit / Construction) → define that type's verticals → build the flows inside each vertical → enroll a client of that type → the tenant side instantly gets nav, list page, detail page, dashboard and archive routing. This business-first configuration journey is the product's signature demo (slides 4–7 of the presentation).
7. **Persona switching** via the avatar menu — the whole app re-scopes (nav, data, guards) per persona. Any change must be checked against personas it might leak between.

## UX and visual-design principles

- **Romanian only**, with correct diacritics, in every user-visible string. Domain vocabulary is deliberate: situație, misiune, anexă, verticală, șablon, etapă/pas, termen, proveniență, Beneficiar (construction's word for Client). Match it.
- **Reuse real components before inventing.** Pages are assembled from the shared shell + `components.css` library (cards, pills, tables, modals, toasts). New page-specific CSS goes in its own prefixed file and extends — never duplicates — shared components.
- **Tokens only**: every color, radius, shadow, spacing and font size comes from `css/tokens.css` custom properties. No new hex values, no `color-mix()` (the codebase doesn't use it). If a needed value doesn't exist, add a token deliberately.
- Design tone: light theme only (no dark mode), calm purple-tinted neutrals, `--color-important` yellow for primary CTAs, semantic status colors (critical pink / pending orange / success green), 8pt spacing grid, Lato, Material Symbols icons. Verticals have identity colors (6 fixed `--vertical-*` accent/surface pairs with ≥4.5:1 contrast, applied via `.va-*` classes).
- Empty states, inline validation (`.form-field.has-error` + `.form-error`), focus traps in modals, `aria-*` on interactive patterns, and toasts on every save/delete are established patterns — new UI must include them.
- Destructive actions get confirmation modals with explicit labels ("Șterge definitiv"); deletes that would orphan live data are blocked with an explanatory modal, not silently allowed.

## Architecture in one paragraph (details in docs/ARCHITECTURE.md)

No framework, no build step, no package.json. ~20 static HTML pages each carry their own copy of the shell markup and load ES5-style IIFE scripts in a fixed order: `shell.js` (personas/nav) → `mock-data.js` (the entire "database": `window.SCRIPTICA_MOCK` + localStorage override merge) → `timer.js` → `dashboard.js` → page script(s). Modules communicate only via `window.*` globals and a few CustomEvents, all feature-detected with `typeof` guards that **degrade silently**. Rendering is innerHTML string templating with per-module `esc()` escapers. State: mock seed → localStorage overrides (`scriptica.*` keys, id→record maps with `{deleted:true}` tombstones) → in-memory mutations that vanish on reload. "Today" is pinned to **2026-04-20** in multiple files so demo data renders stably. There is no backend, no router, no test suite.

## Commands

| Action | Command |
|---|---|
| Install | *(nothing to install)* |
| Run | `python3 -m http.server 5173` from repo root → http://localhost:5173/acasa.html |
| Lint | *(none configured — do not add one without asking)* |
| Test | *(none)* JS syntax sweep: `for f in js/*.js; do node --check "$f" \|\| echo "FAIL: $f"; done` |
| Build | *(no build step — files are deployed as-is)* |
| Deploy (only when explicitly asked) | `npx --yes wrangler pages deploy . --project-name=scriptica --branch=main --commit-dirty=true` — read [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) first; `--branch=main` is mandatory |

## Required verification before a task is complete

1. `node --check` every JS file you touched.
2. **Run the app and look at it.** Serve it, open the affected pages, and visually inspect the result — after *any* UI change. Do not declare success from code reading alone.
3. **Zero console errors** on the pages you touched (the baseline is a clean console).
4. **Test the affected personas** via the avatar menu — at minimum `complet`, plus every persona whose scope touches your change (`contabilitate`/`audit_stat` for domain-gated features, `client` for portal-visible pages, `autoritate` for approval flows, Super Admin for HQ pages). Scope leaks between personas have been the most common real bug class in this project.
5. **Check desktop and a narrower viewport.** The shell is desktop-first (fixed sidebar; not responsive below ~960px — that is accepted), but content grids have breakpoints at 1100/960/760px that must not break.
6. If you changed shared JS/CSS, grep for its `?v=` references and bump the version in **every** HTML page that includes the file (see "Cache-busting" below).
7. If you changed data shapes in `mock-data.js`, test with **stale localStorage** (make an edit in the UI first, then reload) *and* with cleared state — the override merge replaces whole records, so old persisted records can shadow your new fields.

## Important technical constraints

- **Script load order is a contract.** Page scripts capture `window.SCRIPTICA_MOCK` at evaluation time; reordering `<script>` tags breaks pages *silently* (guards no-op instead of throwing). Never reorder; new page scripts go after the shared four.
- **Silent degradation is everywhere**: optional globals (`SCRIPTICA_LISTVIEW`, `SCRIPTICA_ANEXE`, `SCRIPTICA_TOAST`, `renderAvatar`…) are typeof-guarded and features vanish without errors when a dependency is missing. After changes, verify features are actually *present*, not just that nothing throws.
- **Cache-busting is manual**: assets are referenced as `file.js?v=N` per page. Bumping means editing every referencing HTML file; the versions have already drifted (see handoff doc). Locally versions don't matter; live they do.
- **The pinned date 2026-04-20** is duplicated across `mock-data.js`, `situatii.js`, `misiuni-audit.js`, `flux.js`, `list-columns.js`, `dashboard-widgets.js`, `situatie-detaliu.js`, `time-tracking.js`, `anexa-fill.js`. If you must touch it, change all of them.
- **String-keyed coupling**: statuses map to CSS classes (`.sit-status--<status>`), deadlines live in `deadlineStep1..3` props, steps are keyed `'step'+N`, formula refs are `'{anexaId}.{REF}'` strings, archive routing matches document-type *names*. Renames ripple invisibly — grep before renaming anything.
- **Anexă responses are keyed by field index** — reordering fields in a saved anexă's schema silently corrupts all its saved/seeded responses. There is no migration mechanism.
- **Dual render paths**: tables render via the `SCRIPTICA_LISTVIEW` engine *or* a hardcoded legacy fallback (situatii, misiuni-audit, flux). Column changes must be mirrored in both, or made engine-only deliberately.

## Do not modify casually

- `js/mock-data.js` seed IDs, record shapes, and the localStorage merge (`applyAdminOverrides`) — half the app is coupled to them; task-id determinism and `anexaResponseSeeds` field indexes are especially brittle.
- `js/shell.js` persona/view model and nav injection — every page depends on it; nav placement anchors on the literal href `situatii.html`.
- `css/tokens.css` values — changing a token restyles the entire app; add rather than mutate unless the change is explicitly a re-theme.
- The deployed-URL structure (page filenames) — `index.html` → `acasa.html` redirect, presentation deck exit, persona landing pages and many hardcoded cross-links depend on current filenames.
- `export-design-context.md` / `export-constructor-context.md` — frozen historical context dumps (state at commit `beaa2de`); do not "update" them, and do not treat them as current documentation.
- The git branch `main` — it is the preserved pre-audit baseline. Work happens on `audit-vertical` (or branches cut from it).

## Known fragile areas (full list in docs/CODEX_HANDOFF.md)

The recurring shapes of past real bugs: **persona scope leaks** (a widget or page rendering data a persona shouldn't see), **stale localStorage overrides** shadowing new seed fields after data-shape changes, **string-vs-number id round-trips** (archive container ids like `aud_7`), **the two clocks** (pinned demo date vs real `new Date()` in modal validation), and **version-drift** on `?v=` bumps.

## Naming and code style

- ES5-flavored vanilla JS: `var`, function declarations, IIFEs with `'use strict'`, innerHTML templating, per-module `esc()`. Match this even though it's dated — consistency beats modernity in this codebase. No modules/imports, no async/await patterns, no framework.
- Romanian everywhere: UI copy, comments, status enums (`analiza`, `asteapta_documente`, `in_verificare`, `spre_aprobare`, `finalizat`, `inchisa`, `anulata`, `intarziere`), identifiers where domain-bound.
- Ids: prefix scheme `cli_`/`ct_`/`vert_`/`ft_`/`fi_0001`/`anx_`/`dt_`/`af_`/`dw_`/`doc_`/`adoc_`/`audit_0001`; situations are 10-digit zero-padded strings; localStorage keys are `scriptica.<camelCase>`.
- Globals: helper functions `scripticaCamelCase(...)`, namespace objects `SCRIPTICA_UPPER_SNAKE`.
- CSS: BEM-ish `block__element--modifier`, state classes `is-*`/`has-*`, one prefix per page/subsystem (`.sa-` HQ, `.am-`/`.rap-`/`.ws-` audit, `.fx-` flux engine, `.dw-` widgets, `.admin-`, `.anexa-`/`.afield-`, `.prez-`, `.lv-`, `.va-`). JS behavior hooks are `data-*` attributes, never styling classes.
- Comments record provenance ("Phase 9", "Brief #8") and defer work with `// STUB:` / `// NOTĂ:` / "fază ulterioară" — keep that convention for anything you consciously leave incomplete.

## Browser and responsive expectations

Target: current desktop Chrome/Safari/Firefox/Edge. The app is a desktop tool; the fixed shell is not mobile-responsive by design, but verify content-level breakpoints (1100/960/760px) and that nothing horizontally overflows at ~1280px. The presentation deck and the widget dashboard have their own small-screen behavior — check them if touched. External runtime deps (Google Fonts, i.pravatar.cc avatars) have fallbacks; don't add new external dependencies without asking.

## Deployment constraints

Production deploys are **manual, explicit-request-only** (`wrangler pages deploy` with `--branch=main`; GitHub pushes do NOT auto-deploy). Never deploy, push, force-push, or create/delete tags without being asked. Bump `?v=` versions before deploying changed assets. Full procedure + rollback anchors: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Prototype work vs production work

Everything in this repo is prototype work: optimize for **demo credibility, iteration speed, and design fidelity** — not for scalability, security or data integrity. Concretely: mock data and toast-instead-of-action stubs are acceptable outcomes when the brief is about UX; hand-rolled localStorage persistence is the intended "database"; simulated AI (`setTimeout` + seeded confidences) is the intended "AI". What is *not* acceptable, even in a prototype: broken persona scoping, console errors, invented design values, dead-looking UI (missing hover/empty/error states), or regressions to the demo journeys above. If a task smells like *actual* production work (real auth, real backend, real AI integration), stop and discuss — that likely belongs to the separate production platform, not here.
