# AI coding handoff — current state of Scriptica

Originally written 2026-07-16 for the Claude Code → Codex migration. Reconciled and updated 2026-08-18 for the return to Claude Code.

**Provenance labels used below:** ✅ = verified directly against the repository/live services during this handoff; 🧠 = carried over from prior Claude-conversation memory (decisions, intent, history) — trustworthy as recorded intent but re-verify before building on the specifics.

## Executive summary

Scriptica is a live, demo-ready static prototype (HTML/CSS/JS, no framework/build/backend) of a Romanian accounting + public-audit workflow platform, deployed on Cloudflare Pages at scriptica.vandrus.dev. ✅ All work since 2026-06-25 lives on git branch `audit-vertical`; `main` is deliberately frozen as the pre-audit baseline. Production is deployed manually from this branch with wrangler's `--branch=main` flag. ✅ The product is a full two-sided system where Scriptica HQ configures client categories, global flow verticals, beneficiary profiles, archive structures, per-client terminology, Acasă layouts and table columns, while tenant workspaces consume that configuration through shared engines — plus the complete audit-mission vertical and a 7-slide sales deck. The 2026-08-18 handoff recovered the exact live application from a dirty Cloudflare deployment, committed it and pushed it to `origin/audit-vertical`; the live application and Git are therefore reconstructable from the same product source. ✅

## What has already been built

All ✅ (verified in source this week). In build order:

1. **Contabil core** — situații list/detail with per-step tasks, chat, AI-classified documents (simulated), archive tree, time tracking, timer; dual internal/client views.
2. **Admin back-office + Constructor de Anexe** — hash-routed tabs; situation-type step builder; drag-and-drop form builder with 22 field types; per-step anexe that gate "Finalizează pasul".
3. **Audit vertical (briefs #2–#8)** — mission types (`domain:'audit'`), mission list + creation modal + tab strip (Toate/Spre Aprobare/Rapoarte), mission workspace (objectives card, Dosar Permanent, Etapa IV recommendations), Autoritate Decidentă read-only approval with the only persisted decision (`scriptica.auditMissionStatus`), planning page (multiannual/annual, "Demarează" handoff), Rapoarte tab with expandable AI-scored final reports (`AI_TIER` gate).
4. **Typed fields + cross-anexă formulas** — `ref` codes on numeric fields (Constructor), formulas defined at mission-type level (administrare) with self-ref/cycle/duplicate validation, safe recursive-descent evaluator at fill time with 4 computed-field states + derivation modal; Anexa 9 / HG 1086/2013 risk-chain demo.
5. **Personas by access-area** — 6 personas + Super Admin, domain scoping (contabil/audit) across nav, page guards, data filters, archive, anexe. Default persona is `complet`.
6. **Super Admin (Scriptica HQ) zone** — ops dashboard with the downtime-by-cause model (`server`=outage/critical, `ai_vm`=AI-only outage/warn, `ai_limit`=plan-cap throttling = **upsell signal, not an incident**), clients list + enrollment, client detail (commercial/technical/flags).
7. **Flow registry + generic engine** — the client type remains a stable category, while the global registry defines verticals (identity + document vocabulary) and the templates inside each vertical; `flux.html`/`flux-detaliu.html` render any custom vertical; builtins redirect to dedicated pages; per-vertical table columns (`listView` + `SCRIPTICA_LISTVIEW` engine + HQ table builder in a simulated tenant page); category archive configuration and a per-client Acasă dashboard builder (palette/preview/order/size).
8. **Construcții client type + one-step flows** — templates may have a single step; seeded `ct_constructii` showcase; team-facing thesis doc `caz-utilizare-constructii.html`.
9. **Presentation deck** — 7 slides (3 PNG + 4 live HTML showing the three business types, the client-type hierarchy, the HQ configuration journey and the generated tenant experience), two-press exit into the prototype.
10. **UX pass from colleague feedback + Tipuri de clienți v2** (the most recent commits, 2026-07-14) — vertical identity colors everywhere, redesigned client-type cards with stat chips/search/filter/sort/expander.
11. **Constructor Fluxuri V2 promoted to the canonical HQ page** (2026-07-19) — per-template steps, individual mandatory tasks, attached anexe, required-field gating preview, long horizontal timelines and independent library/editor scrolling. Ciornele live in `scriptica.prototype.fluxuriV2`; publishing an unused/new flux writes the complete record through `scripticaFlowSave('template', ...)`, so Tipuri de clienți and enrolment read the same central registry. Fluxes already used by an enrolled client remain drafts until the propagation policy is decided.
12. **Vertical document vocabulary** (2026-07-19) — the vertical is only the category for a set of flows and owns the document categories/types used by local-AI classification. Each document type has one default category; every flow inherits the vocabulary but may hide irrelevant categories; `Necategorisit` is permanent. Archive organization remains separate and follows flow needs rather than duplicating classification categories.
13. **Five-step per-client onboarding** (2026-08) — identity/category → configurable beneficiary enrollment form → optional contracted verticals → per-account terminology/archive labels → individual Acasă layout. A client may finish with zero verticals and an intentionally empty dashboard.
14. **Beneficiary profile system** — HQ defines a reusable profile schema per client category and may override it per account; one shared renderer powers internal editing and the external-form preview. Selected profile fields can become client-table columns without duplicating the data model.
15. **Data-source table builder** — table columns may resolve system values, beneficiary-profile fields or supported annex fields. The effective order is per-account override → vertical default → legacy `listView` → safe system defaults, with live tenant preview and unsupported-source guards.
16. **Required document-upload tasks** — normal and document-upload tasks share the flow-step model. Upload tasks store the document type, single/multiple behavior and minimum file count; completion is gated until the requirement is satisfied and generated document records enter the prototype archive flow.
17. **Multi-vertical annex governance** — one annex may be available in several verticals without duplication. The library derives workflow usage and annex relationships, shows impact before destructive changes, and retires used/related annexes instead of corrupting historical responses.

## State at the 2026-08-18 handoff

The newest milestone is live and recovered into Git: per-client vertical assignments, terminology and dashboards; configurable beneficiary profiles; data-source table columns; required document-upload tasks; and multi-vertical annex impact handling. The working tree was intentionally reconciled against production file by file before committing. Fluxuri V2 publishes new/unused templates into the canonical registry; the remaining product decision is how a later published template version should affect clients already using that flow. Until decided, the UI preserves the draft and blocks propagation rather than silently modifying client configuration.

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
- **Client category is separate from contracted verticals and Acasă** (2026-08-04, superseding the mandatory 2026-07-24 sequence) — HQ may create a client category and enroll a client before any vertical exists. Onboarding step 3 optionally assigns the verticals included in that individual client's plan, step 4 adapts per-account terminology/archive labels, and the final step 5 configures that client's Acasă layout. The client may still be created with none and an empty dashboard. `clients[].moduleAssignments[]` is retained as the legacy technical property name for vertical assignments; `clients[].dashboardLayout[]` owns Acasă. Legacy category package/layout arrays remain only as stale-state/demo migration inputs.
- **Vertical removal never deletes client data** — a plan downgrade deactivates/hides the vertical. Operational history, documents, conversations, anexă responses, the archive and the saved Acasă layout remain intact; reactivation restores the same history and widgets. A used vertical/template is retired, never hard-deleted.
- **Clasificare ≠ arhivă** — categories/types belong to the vertical; archive folders follow operational flow needs and remain independently configured.
- **`main` is frozen as the pre-audit rollback baseline**; all work continues on `audit-vertical` deployed with `--branch=main`. ✅

## Known incomplete work (stubs by design vs gaps)

✅ verified in source. Deliberate prototype stubs (fine to leave): header search/notifications/language, Setări/Deconectare, HQ sidebar Infrastructură/Facturare/Setări, doc download/share buttons, report Previzualizează/Share/Export Word, "Trimite documente" (client), timer pill `href="#"`.

Real gaps to be aware of:

- **Built-in mission/situation creation modals do not persist** — validate, toast, close; nothing is added to data. Generic custom-flow creation does persist through `scripticaFlowSave`.
- **`repeater_block` has no fill renderer** — a saved anexă containing one shows "Tip necunoscut: repeater_block" in the real fill modal; repeaters only work in the Constructor preview. The `calculated` field type is display-only everywhere.
- **Workspace chat composer (audit) has no send handler**; doc-row actions/checkboxes in the audit workspace are unwired.
- **Admin edits to internal users and tags are in-memory only** (only anexe + situationTypes persist).
- **Generic flow instances still lack lifecycle management actions** — no edit/cancel/delete for flow items; several statuses remain unreachable from the UI. The shared workspace now persists configured task completion, required uploads, annex responses, documents and step progress.
- **HQ client detail**: feature-flag toggles and pause/cancel/edit-name buttons mutate nothing persistent.
- **Per-client verticals, terminology and Acasă are implemented for the prototype**: HQ clients can start with zero verticals or select them in onboarding step 3, adapt terminology/archive labels in step 4, then configure Acasă in the final step 5. Active/inactive assignments live in legacy-named `moduleAssignments[]`; terminology differences live in `terminologyOverrides`; the dashboard layout lives on the client and can be edited later from its profile. Nav, dashboard, built-in/generic flow surfaces and archive labels consume the central resolvers. Remaining production-model gap: most seeded operational records are shared demo data rather than carrying an HQ-client owner id; new generic flow records do receive `tenantAccountId`.
- **Three admin tabs greyed out**: Solicitări interne, Configurare Arhivă, Conținut Acasă (archive is superseded by the HQ category editor; Acasă by the HQ per-client editor).
- 15 audit anexă schemas carry `// STUB: câmpuri de validat vs HG 1086/2013`; FIAP external-signature flow and FCRI 3-day escalation explicitly deferred.

## Known bugs (small, none demo-blocking) ✅

- **Status-label drift**: flux.js labels `in_verificare` "În Lucru" and lacks `aprobata`; list-columns.js says "În Verificare" and has it — same row can read differently depending on render path.
- `rapoarte-audit.js` FINAL_STATUSES includes `respinsa` but no code path ever sets it (Respinge maps to `in_verificare`); "changes_requested" sends a chat message but changes no status.
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

Simulated AI (setTimeout + seeded confidences, `observatieAI: 'Rezultate AI simulate pentru demo'`); AI_TIER hardcoded `true`; localStorage as database; cosmetic client-side "permissions"; legacy built-in chat/tasks/uploads are mostly in memory while generic custom-flow progress/uploads persist; hardcoded Canvas client id 1 for the client persona; hardcoded enrollment dates in HQ new-client modal; pravatar.cc avatars.

## Rejected approaches (do not re-propose) 🧠

- External Autoritate Decidentă persona (rejected for the internal top-seniority model).
- Formula editing inside the Constructor (rejected — belongs at mission-type level; "once per type, applies to all missions").
- Forked strict-numeric field types (rejected — native `type=number` + `ref` code was enough; flagged as acceptable).
- Copying app.scriptica.ro's design/data/"Instanță" multi-tenant concept (out of scope; only its Administrare panel *functionality* was adapted).
- Column editor as a modal (rejected by Vlad for a dedicated simulated-tenant page).
- Brief-specified visual values that contradict tokens (e.g. 10px card radius) — tokens win.
- Treating the client category itself as the permanent vertical entitlement is superseded. Do not solve vertical visibility by merely reusing `clientType.verticalIds`; assignments must belong to the individual HQ client and preserve inactive history.

## Unresolved product questions 🧠

1. **Commercial assignment granularity is vertical-based** — a vertical is the unit enabled for a client and its eligible templates are snapshotted by id on assignment. Do not duplicate flow definitions inside each client.
2. **Propagation of published flow changes** — Fluxuri now supports different steps per template and publishes new/unused templates centrally. Decide whether a later version updates existing customers, affects only future enrolments, or is offered as an explicit per-customer upgrade. Until then, publishing is held when an enrolled client already uses that template.
3. Audit-report scoring: currently seeded mock; the real plan is a local-LLM computation on a paid tier ("fază ulterioară").
4. ct_mixt archive has no Corespondență folder, so e-mails land in Necategorisit for the complet view — configurable at HQ, deliberately NOT called a bug; decide whether the seed should include it.
5. ~~**Activate tasks/anexe/documents on generic verticals.**~~ ✅ Resolved for the prototype: the shared workspace persists configured tasks, required document uploads, annex responses, generated document records and step progress. Full lifecycle actions and production tenant ownership remain separate gaps.
6. ~~**Future onboarding step — client-specific vocabulary.**~~ ✅ Resolved 2026-08-04: step 4 edits the external-party labels, selected vertical/item labels and inherited/generated archive folder names per account; Acasă remains final in step 5. Resets remove overrides, empty values are blocked inline, and stable ids/routing are never changed.

## Unresolved technical questions

1. Whether to introduce any tooling (linter, shared template for shell markup, a version-bump script for `?v=`) — each trades prototype simplicity for maintenance relief; none decided.
2. Whether stale-localStorage migrations are worth building before more data-shape changes (currently: "clear storage" is the documented answer).
3. The audit workspace's in-memory demo state leaking between missions in one session — acceptable now; unclear if it stays acceptable as demos get longer.

## Next recommended tasks (priority order)

1. ~~**Align cache-bust versions.**~~ ✅ Resolved 2026-08-04; shared dashboard, timer, shell and mock-data references are aligned across the HTML pages.
2. **Fix the status-label drift** between `js/flux.js` (STATUS_LABELS) and `js/list-columns.js` — pick list-columns' wording as canonical. *Files: js/flux.js, js/list-columns.js.*
3. ~~**Decide + implement audit-home behavior on acasa.html.**~~ ✅ Resolved 2026-08-04: dashboard widgets are filtered by both active vertical and persona scope; `routeAuditHome()` is restricted to `acasa.html` and can no longer overwrite generic flow pages.
4. **Stop the time-tracking modal from mutating live task lists** (build the picker from a copy). *Files: js/time-tracking.js (openSessionEditModal ~line 458).*
5. **Remove or gate the #debug-bar** on situatie-detaliu behind something explicit. *Files: situatie-detaliu.html, js/situatie-detaliu.js (~line 766).*
6. **Renderer for `repeater_block` in anexa-fill.js** — the Constructor already sells it; the fill modal breaks the illusion. *Files: js/anexa-fill.js (fieldHtml), css/anexe.css; reference: js/constructor-anexe.js preview implementation.*
7. ~~**Implement per-client vertical assignments and Acasă end to end.**~~ ✅ Resolved 2026-08-04: zero-vertical onboarding remains allowed, step 3 assigns verticals, step 4 configures per-account terminology, and final step 5 configures the per-client dashboard. Active/inactive history is stored per HQ client, tenant preview gates navigation/creation/dashboard surfaces, and archives/layout/terminology remain resolvable after deactivation. Deactivation only hides data; it never deletes the flow history or archive.
8. Dead-code sweep (MOCK_DOC_NAMES, formatDateTime, `.sa-cols-*` CSS, dead conditional) — cheap hygiene, zero behavior change.
9. Add edit/cancel lifecycle actions for generic flow instances after the desired status transitions are agreed; do not invent new transitions from the current labels.

## Assumptions previously only in Claude conversations 🧠

- Vlad works from a Mac Studio (this machine) and a laptop; an iCloud bundle (`~/Library/Mobile Documents/com~apple~CloudDocs/Claude projects and skills/`) carries project + credentials context between them, refreshed after big sessions. It contains a **plain-text copy of the Cloudflare wrangler token** (`secrets/wrangler-default.toml`) — a consciously accepted trade-off; that bundle must never be committed anywhere.
- The standing deployment agreement: the agent deploys **only when Vlad explicitly says to**, and always with `--branch=main`.
- Colleague feedback drives UX passes (e.g. the 2026-07-14 "UX pass (feedback colegi)" commit); the deck and caz-utilizare doc exist to persuade the internal team, not customers.
- Slide claims were adversarially fact-checked against code (16/25 confirmed; wording scoped for the rest) — deck wording is deliberately precise; don't "improve" it into inaccuracy.
- Cache-bust bumping convention: bump shared JS together (historically `?v=N` moved in lockstep: v=27 → v=28 → …), page-specific files version independently.
