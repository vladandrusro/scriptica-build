# Codex handoff — current state of Scriptica

Written 2026-07-16, at the moment of migrating from Claude Code to OpenAI Codex.

**Provenance labels used below:** ✅ = verified directly against the repository/live services during this handoff; 🧠 = carried over from prior Claude-conversation memory (decisions, intent, history) — trustworthy as recorded intent but re-verify before building on the specifics.

## Executive summary

Scriptica is a live, demo-ready static prototype (HTML/CSS/JS, no framework/build/backend) of a Romanian accounting + public-audit workflow platform, deployed on Cloudflare Pages at scriptica.vandrus.dev. ✅ All work since 2026-06-25 lives on git branch `audit-vertical` (22 commits ahead of `main`, which is deliberately kept as the pre-audit baseline); production is deployed manually from this branch with wrangler's `--branch=main` flag. ✅ The product story reached its current milestone: a full two-sided system where Scriptica HQ configures client types / flow verticals / archive trees / dashboards / table columns, and the tenant side instantly reflects that configuration through a generic flow engine — plus a complete audit-mission vertical and a 7-slide sales deck. The working tree is clean and the latest commit is deployed. ✅

## What has already been built

All ✅ (verified in source this week). In build order:

1. **Contabil core** — situații list/detail with per-step tasks, chat, AI-classified documents (simulated), archive tree, time tracking, timer; dual internal/client views.
2. **Admin back-office + Constructor de Anexe** — hash-routed tabs; situation-type step builder; drag-and-drop form builder with 22 field types; per-step anexe that gate "Finalizează pasul".
3. **Audit vertical (briefs #2–#8)** — mission types (`domain:'audit'`), mission list + creation modal + tab strip (Toate/Spre Aprobare/Rapoarte), mission workspace (objectives card, Dosar Permanent, Etapa IV recommendations), Autoritate Decidentă read-only approval with the only persisted decision (`scriptica.auditMissionStatus`), planning page (multiannual/annual, "Demarează" handoff), Rapoarte tab with expandable AI-scored final reports (`AI_TIER` gate).
4. **Typed fields + cross-anexă formulas** — `ref` codes on numeric fields (Constructor), formulas defined at mission-type level (administrare) with self-ref/cycle/duplicate validation, safe recursive-descent evaluator at fill time with 4 computed-field states + derivation modal; Anexa 9 / HG 1086/2013 risk-chain demo.
5. **Personas by access-area** — 6 personas + Super Admin, domain scoping (contabil/audit) across nav, page guards, data filters, archive, anexe. Default persona is `complet`.
6. **Super Admin (Scriptica HQ) zone** — ops dashboard with the downtime-by-cause model (`server`=outage/critical, `ai_vm`=AI-only outage/warn, `ai_limit`=plan-cap throttling = **upsell signal, not an incident**), clients list + enrollment, client detail (commercial/technical/flags).
7. **Flow registry + generic engine** — the visible HQ journey starts with the client type, then defines its verticals (identity + document vocabulary) and the templates inside each vertical; `flux.html`/`flux-detaliu.html` render any custom vertical; builtins redirect to dedicated pages; per-vertical table columns (`listView` + `SCRIPTICA_LISTVIEW` engine + HQ table builder in a simulated tenant page); archive configuration and Acasă dashboard builder (palette/preview/drag).
8. **Construcții client type + one-step flows** — templates may have a single step; seeded `ct_constructii` showcase; team-facing thesis doc `caz-utilizare-constructii.html`.
9. **Presentation deck** — 7 slides (3 PNG + 4 live HTML showing the three business types, the client-type hierarchy, the four-step HQ configuration journey and the generated tenant experience), two-press exit into the prototype.
10. **UX pass from colleague feedback + Tipuri de clienți v2** (the most recent commits, 2026-07-14) — vertical identity colors everywhere, redesigned client-type cards with stat chips/search/filter/sort/expander.
11. **Constructor Fluxuri V2 promoted to the canonical HQ page** (2026-07-19) — per-template steps, individual mandatory tasks, attached anexe, required-field gating preview, long horizontal timelines and independent library/editor scrolling. Ciornele live in `scriptica.prototype.fluxuriV2`; publishing an unused/new flux writes the complete record through `scripticaFlowSave('template', ...)`, so Tipuri de clienți and enrolment read the same central registry. Fluxes already used by an enrolled client remain drafts until the propagation policy is decided.
12. **Vertical document vocabulary** (2026-07-19) — the vertical is only the category for a set of flows and owns the document categories/types used by local-AI classification. Each document type has one default category; every flow inherits the vocabulary but may hide irrelevant categories; `Necategorisit` is permanent. Archive organization remains separate and follows flow needs rather than duplicating classification categories.

## What was being worked on (state at handoff)

The current local working tree contains the Fluxuri V2 / Tipuri de clienți V2 explorations and the Super Admin Anexe navigation work. Fluxuri V2 is now wired to the canonical registry for new/unused templates, but has not been deployed as part of this update. The remaining product decision is how a newly published template version should affect clients already using that flux; until decided, the UI preserves the draft and blocks that publication without modifying client configuration.

## Recent important decisions and why

All 🧠 (recorded from prior conversations), with code effects verified ✅:

- **Autoritate Decidentă is internal, not external** (2026-06-25): re-modeled as the firm's top-seniority user who sees everything and approves missions; entity-scope filtering was removed from the mission list.
- **Commercial model** (deck slide 4): Super Admin = Scriptica itself; audit missions + anexe = paid tier; flow types = standard, never gated. Fluxuri / misiuni / situații are the SAME concept named per audience.
- **"Codul câștigă" / Regula 0**: when a brief conflicts with the real component library, the code's tokens/components win (e.g. brief's 10px card radius rejected in favor of `--radius-lg`). ⚠️ Note: this principle is **not written in DESIGN_SYSTEM.md** — it lived in conversation; AGENTS.md now records it. ✅
- **Formula linking lives at mission-type level, not in the Constructor** — the Constructor only defines `ref` codes; one formula set per type applies to all its missions.
- **Flow registry semantics chosen by Vlad**: two-layer granularity (vertical + template), seed-then-editable provisioning, ONE client type per client (hybrids get a dedicated mixed type), functional generation (not mock-only).
- **Table-column editor is a dedicated simulated-tenant page**, not a modal (Vlad's explicit request; the old modal was removed, `?cols=` deep links redirect).
- **One-step flows allowed** to serve "projects-only" businesses like construction — the step is the *container* (anexe/docs/tasks/chat), not bureaucracy.
- **Verticala nu definește pașii** — it groups related flows and defines their document-classification vocabulary. Each template owns its complete sequence of steps.
- **Configurarea HQ pornește de la tipul de client** (2026-07-24, feedback de echipă) — ordinea vizibilă și demonstrabilă este Tip client → Verticale → Fluxuri → Client. Modelul de date rămâne compatibil: `clientTypes[].verticalIds` și `defaultTemplateIds` exprimă deja relațiile, iar noile verticale/fluxuri se atașează automat tipului aflat în context.
- **Clasificare ≠ arhivă** — categories/types belong to the vertical; archive folders follow operational flow needs and remain independently configured.
- **`main` is frozen as the pre-audit rollback baseline**; all work continues on `audit-vertical` deployed with `--branch=main`. ✅

## Known incomplete work (stubs by design vs gaps)

✅ verified in source. Deliberate prototype stubs (fine to leave): header search/notifications/language, Setări/Deconectare, HQ sidebar Infrastructură/Facturare/Setări, doc download/share buttons, report Previzualizează/Share/Export Word, "Trimite documente" (client), timer pill `href="#"`.

Real gaps to be aware of:

- **Mission/situation creation modals do not persist** — validate, toast, close; nothing is added to data. (Situations AND audit missions.)
- **`repeater_block` has no fill renderer** — a saved anexă containing one shows "Tip necunoscut: repeater_block" in the real fill modal; repeaters only work in the Constructor preview. The `calculated` field type is display-only everywhere.
- **Workspace chat composer (audit) has no send handler**; doc-row actions/checkboxes in the audit workspace are unwired.
- **Admin edits to internal users and tags are in-memory only** (only anexe + situationTypes persist).
- **Generic flow instances still lack lifecycle management actions** — no edit/cancel/delete for flow items; several statuses remain unreachable from the UI. The shared workspace now renders the configured tasks, anexe and document vocabulary.
- **HQ client detail**: feature-flag toggles and pause/cancel/edit-name buttons mutate nothing persistent.
- **Three admin tabs greyed out**: Solicitări interne, Configurare Arhivă, Conținut Acasă (the latter two now conceptually superseded by the HQ per-client-type editors).
- 15 audit anexă schemas carry `// STUB: câmpuri de validat vs HG 1086/2013`; FIAP external-signature flow and FCRI 3-day escalation explicitly deferred.

## Known bugs (small, none demo-blocking) ✅

- **Cache-version drift**: `situatie-detaliu.html` loads `dashboard.js?v=28` while 18 pages use `?v=30`; `timer.js` is `?v=28` on 13 pages vs `?v=29` on 6; `design-system.html` loads mock-data.js/timer.js with no `?v=` at all. (Good first Codex task — see checklist.)
- **Status-label drift**: flux.js labels `in_verificare` "În Lucru" and lacks `aprobata`; list-columns.js says "În Verificare" and has it — same row can read differently depending on render path.
- `rapoarte-audit.js` FINAL_STATUSES includes `respinsa` but no code path ever sets it (Respinge maps to `in_verificare`); "changes_requested" sends a chat message but changes no status.
- Widget dashboard **overwrites the audit personas' "Acasă · Audit" scope-block** on acasa.html when ct_audit has a dashboardLayout (two renders per load; last one wins). Behavior is acceptable-looking but the double render is real.
- `arhiva_recente` widget: for `system` folders the doc filter degenerates to *all* documents.
- time-tracking session-edit modal **injects phantom tasks into the live situation task list** (mutates `sit.tasks` while building its picker).
- `renderAvatar` fallback HTML contains a stray `">` artifact (brittle nested-quote string in shell.js).
- New audit objective omits `recomandare` → renders "Nespecificat"; no editing UI.
- Dead code: `MOCK_DOC_NAMES` (situatie-detaliu.js), `formatDateTime` (documents.js), dead conditional `resultType = type==='number' ? 'decimal' : 'decimal'` (administrare.js:832), leftover `.sa-cols-*` CSS family from the removed column modal.
- A `#debug-bar` ("DEBUG · Vizualizări demo") ships in situatie-detaliu — intentional dev aid, but it is visible in production.
- caz-utilizare-constructii.html hardcodes `#E8F7E7` (violates its own tokens-only comment); constructor header comment says "21 tipuri de module" but FIELD_TYPES has 22.
- Slide PNGs have `600` file permissions on disk — fine for wrangler deploys, may surprise a naive copy on another machine.

## Technical debt ✅

Detailed with mitigation context in [ARCHITECTURE.md](ARCHITECTURE.md) "risks" — headline items: manual `?v=` bumping across ~20 pages; N copies of shell markup; pinned demo date duplicated in ~9 files; duplicated per-module `esc()`/trapFocus/status-label maps with drift; whole-record localStorage merge without migrations; field-index-keyed anexă responses; task-id determinism tied to seeded time sessions; dual render paths (engine + legacy fallback) in three list pages; `documents.js` vs `situatie-detaliu.js` resolving `?id=` independently with different fallbacks; DESIGN_SYSTEM.md and design-system.html both stale vs current tokens/components.

## Temporary prototype decisions (intentional, revisit only for production)

Simulated AI (setTimeout + seeded confidences, `observatieAI: 'Rezultate AI simulate pentru demo'`); AI_TIER hardcoded `true`; localStorage as database; cosmetic client-side "permissions"; in-memory chat/tasks/uploads; hardcoded Canvas client id 1 for the client persona; hardcoded enrollment dates in HQ new-client modal; pravatar.cc avatars.

## Rejected approaches (do not re-propose) 🧠

- External Autoritate Decidentă persona (rejected for the internal top-seniority model).
- Formula editing inside the Constructor (rejected — belongs at mission-type level; "once per type, applies to all missions").
- Forked strict-numeric field types (rejected — native `type=number` + `ref` code was enough; flagged as acceptable).
- Copying app.scriptica.ro's design/data/"Instanță" multi-tenant concept (out of scope; only its Administrare panel *functionality* was adapted).
- Column editor as a modal (rejected by Vlad for a dedicated simulated-tenant page).
- Brief-specified visual values that contradict tokens (e.g. 10px card radius) — tokens win.
- Gating tenant nav by clientType.verticalIds was CONSIDERED and consciously not done (see next section) — don't silently "fix" it.

## Unresolved product questions 🧠

1. **Tenant nav shows ALL custom verticals for every client type** (shell.js `injectCustomVerticalNav`) — kept for the instant-demo effect; gating by `clientType.verticalIds` is the coherent alternative. Flagged, awaiting Vlad's call.
2. **Propagation of published flow changes** — Fluxuri now supports different steps per template and publishes new/unused templates centrally. Decide whether a later version updates existing customers, affects only future enrolments, or is offered as an explicit per-customer upgrade. Until then, publishing is held when an enrolled client already uses that template.
3. When/how to **activate anexe/documents/chat on generic verticals** (the "de activat" row in caz-utilizare).
4. Audit-report scoring: currently seeded mock; the real plan is a local-LLM computation on a paid tier ("fază ulterioară").
5. ct_mixt archive has no Corespondență folder, so e-mails land in Necategorisit for the complet view — configurable at HQ, deliberately NOT called a bug; decide whether the seed should include it.

## Unresolved technical questions

1. Whether to introduce any tooling (linter, shared template for shell markup, a version-bump script for `?v=`) — each trades prototype simplicity for maintenance relief; none decided.
2. Whether stale-localStorage migrations are worth building before more data-shape changes (currently: "clear storage" is the documented answer).
3. The audit workspace's in-memory demo state leaking between missions in one session — acceptable now; unclear if it stays acceptable as demos get longer.

## Next recommended tasks (priority order)

1. **Align cache-bust versions** (`dashboard.js?v=30`, `timer.js?v=29` everywhere; add `?v=` on design-system.html) — mechanical, high-confidence starter. *Files: all `*.html`.*
2. **Fix the status-label drift** between `js/flux.js` (STATUS_LABELS) and `js/list-columns.js` — pick list-columns' wording as canonical. *Files: js/flux.js, js/list-columns.js.*
3. **Decide + implement audit-home behavior on acasa.html** (widget dashboard vs scope-block double render). *Files: js/dashboard.js (routeAuditHome), js/dashboard-widgets.js (DOMContentLoaded swap).*
4. **Stop the time-tracking modal from mutating live task lists** (build the picker from a copy). *Files: js/time-tracking.js (openSessionEditModal ~line 458).*
5. **Remove or gate the #debug-bar** on situatie-detaliu behind something explicit. *Files: situatie-detaliu.html, js/situatie-detaliu.js (~line 766).*
6. **Renderer for `repeater_block` in anexa-fill.js** — the Constructor already sells it; the fill modal breaks the illusion. *Files: js/anexa-fill.js (fieldHtml), css/anexe.css; reference: js/constructor-anexe.js preview implementation.*
7. **Vlad's call on nav gating by client type** (question 1 above), then implement in shell.js if approved. *Files: js/shell.js (injectCustomVerticalNav), js/mock-data.js (clientTypes).*
8. Dead-code sweep (MOCK_DOC_NAMES, formatDateTime, `.sa-cols-*` CSS, dead conditional) — cheap hygiene, zero behavior change.

## Assumptions previously only in Claude conversations 🧠

- Vlad works from a Mac Studio (this machine) and a laptop; an iCloud bundle (`~/Library/Mobile Documents/com~apple~CloudDocs/Claude projects and skills/`) carries project + credentials context between them, refreshed after big sessions. It contains a **plain-text copy of the Cloudflare wrangler token** (`secrets/wrangler-default.toml`) — a consciously accepted trade-off; that bundle must never be committed anywhere.
- The standing deployment agreement: the agent deploys **only when Vlad explicitly says to**, and always with `--branch=main`.
- Colleague feedback drives UX passes (e.g. the 2026-07-14 "UX pass (feedback colegi)" commit); the deck and caz-utilizare doc exist to persuade the internal team, not customers.
- Slide claims were adversarially fact-checked against code (16/25 confirmed; wording scoped for the rest) — deck wording is deliberately precise; don't "improve" it into inaccuracy.
- Cache-bust bumping convention: bump shared JS together (historically `?v=N` moved in lockstep: v=27 → v=28 → …), page-specific files version independently.
