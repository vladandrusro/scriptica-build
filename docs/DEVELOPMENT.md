# Development setup

> Written from a clean-machine perspective. Every command below was run and verified on 2026-07-16 (macOS, zsh).

## What this project is, in one line

A **static HTML/CSS/JS prototype** — no framework, no build step, no bundler, no `package.json`, no dependencies to install. You serve the folder over HTTP and open it in a browser.

## Prerequisites

| Tool | Version | Needed for | Check |
|---|---|---|---|
| A web browser | any modern (Chrome/Safari/Firefox/Edge) | running the app | — |
| Python 3 | any 3.x (macOS ships one) | the local dev server (`http.server`) | `python3 --version` |
| Git | any recent | version control | `git --version` |
| Node.js + npm | Node ≥ 18 | **only** for `npx wrangler` (deploys) and occasional `node --check` syntax checks | `node --version` |
| GitHub CLI (`gh`) | any recent | GitHub auth/PRs (optional for local dev) | `gh --version` |

There is **no package manager step**: no `npm install`, no lockfile, nothing to build. The only external runtime dependency is Google Fonts (Lato + Material Symbols Outlined), loaded from `fonts.googleapis.com` at page load — so the app needs internet access to render icons/fonts correctly, but works functionally offline.

## Installation

```bash
git clone https://github.com/vladandrusro/scriptica-build.git
cd scriptica-build
git checkout audit-vertical    # ← the current working branch; `main` is a stale pre-audit baseline
```

That's it. No further setup.

## Running the app

From the repo root:

```bash
python3 -m http.server 5173
```

Then open **http://localhost:5173/acasa.html** (or just `http://localhost:5173/` — `index.html` redirects to `acasa.html`).

Any static file server on any port works equally well (`npx serve`, `php -S`, VS Code Live Server…) — port 5173 is just the project convention (it is also recorded in `.claude/launch.json` for the Claude Code preview pane).

**Do not open the HTML files via `file://`** — same-origin quirks and font loading make behavior unreliable; always use an HTTP server.

## Local environment / env vars

None are needed to run the app. `.env.example` documents the two variables that exist, both **deploy-only** (Cloudflare). No JavaScript in this repo reads environment variables — there is no dotenv, no config loader.

## Tests

There are **no automated tests** and no test runner. Quality is verified manually in the browser (see "Verifying the project works" below). Two lightweight checks used historically:

```bash
# syntax-check any JS file after editing:
node --check js/mock-data.js

# syntax-check all JS at once:
for f in js/*.js; do node --check "$f" || echo "FAIL: $f"; done
```

The formula evaluator in `js/anexa-fill.js` (`evalExpr`) and its cycle detection were unit-tested ad hoc via `node` scripts during development, but those scripts were not committed. If you change the evaluator, re-create equivalent tests before trusting the change.

## Lint and formatting

None configured — no ESLint, no Prettier, no `.editorconfig`. Match the style of the file you are editing (see AGENTS.md "Naming and code style"). Do not introduce a linter/formatter without asking: reformatting would create massive diffs across hand-written files.

## Database / migrations / seed data

There is no database. The entire dataset is **mock data hard-coded in [`js/mock-data.js`](../js/mock-data.js)** (the de-facto database, with "today" pinned to **2026-04-20** so relative dates render stably). User edits made through the UI (admin CRUD, anexa fills, mission statuses, HQ configuration) are persisted as **overrides in browser `localStorage`** under `scriptica.*` keys and merged over the mock data at page load. See [ARCHITECTURE.md](ARCHITECTURE.md) for the full key list.

- "Seeding" = whatever is in `js/mock-data.js` at load.
- "Migrations" = not a concept here; changing mock-data shapes may require guarding against stale persisted `localStorage` values (this has bitten before — see CODEX_HANDOFF.md).

## Resetting local state

All user-made changes live in `localStorage` for the `localhost:5173` origin. To reset to a pristine demo:

- DevTools → Application → Local Storage → `http://localhost:5173` → delete the `scriptica.*` keys, **or**
- Run in the browser console:

```js
Object.keys(localStorage)
  .filter(k => k.startsWith('scriptica.'))
  .forEach(k => localStorage.removeItem(k));
location.reload();
```

Note this also resets the selected persona (`scriptica.view`) back to the default (`complet`).

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `OSError: [Errno 48] Address already in use` | Another server on 5173. `lsof -ti :5173 \| xargs kill`, or use another port. |
| Edited JS/CSS but browser shows old behavior | Hard reload (Cmd+Shift+R). Locally the `?v=N` query strings don't matter, but the browser cache still can. |
| Icons show as text like `description` | Google Fonts (Material Symbols) not loaded — check internet access. |
| A page renders empty / weird after changing mock data | A stale `scriptica.*` localStorage override no longer matches the new data shape. Reset local state (above). |
| Page behaves as the wrong persona | `scriptica.view` is persisted; switch persona via the avatar menu (a `?view=` URL param alone does not persist). Admin pages force the admin view except for the `complet` persona. |
| Deploy went out but the live site didn't change | You deployed a Preview, not Production — see [DEPLOYMENT.md](DEPLOYMENT.md) gotcha. |

## Verifying the project works

1. Start the server, open `http://localhost:5173/acasa.html`.
2. DevTools console: **zero errors** is the expected baseline (verified 2026-07-16).
3. Avatar menu (top right) → switch through the personas: `complet`, `contabilitate`, `audit (stat)`, `client`, `administrator`, `autoritate decidentă`, plus "Vezi ca Super Admin". Nav items should appear/disappear per persona and no page should error.
4. Spot-check the main flows: `situatii.html` table → open a situation; `misiuni-audit.html` → open a mission workspace; `arhiva.html` tree; `super-admin.html` HQ dashboard.
5. For UI changes, verify **both desktop and a narrow viewport**, since the shell is a sidebar layout (see AGENTS.md "Browser and responsive testing").
