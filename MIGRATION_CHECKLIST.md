# Codex migration checklist

Work through this top to bottom. Each step says the exact command (type it in Terminal unless it says otherwise), what you should see, and what it means. Nothing here changes the live site.

---

## 1. Install and open Codex

- [ ] **Install the Codex CLI.**
  ```bash
  npm install -g @openai/codex
  ```
  Expected: install finishes without errors. Check with `codex --version` (prints a version number).
  *(Alternative: `brew install codex` if you prefer Homebrew, or use the Codex IDE/desktop app — any of them reads the same files.)*

- [ ] **Sign in.** Run `codex` once; it will offer to sign in with your ChatGPT account in the browser. Approve there. No key is typed or stored in this repo.

## 2. Open the repository

- [ ] ```bash
  cd "/Users/vandrus/Desktop/Scriptica Build"
  codex
  ```
  Expected: Codex starts a session in this folder.

- [ ] **Verify AGENTS.md is detected.** Ask Codex: *"What are the verification rules in this repo's AGENTS.md?"*
  Expected: it answers with the rules from [AGENTS.md](AGENTS.md) (run the app after UI changes, check console errors, test personas, desktop + mobile). If it doesn't know, it isn't reading the repo root — check you started it inside the project folder.

## 3. Verify dependencies

- [ ] ```bash
  python3 --version && node --version && git --version && gh --version
  ```
  Expected: four version numbers, no "command not found". (These are the only tools needed — this project has **no npm install step**.)

## 4. Authenticate GitHub

- [ ] ```bash
  gh auth status
  ```
  Expected: `✓ Logged in to github.com account vladandrusro`. If not, run `gh auth login` and approve in the browser (details in [docs/ACCESS_SETUP.md](docs/ACCESS_SETUP.md) §A).

## 5. Authenticate Cloudflare

- [ ] ```bash
  npx --yes wrangler whoami
  ```
  Expected: "You are logged in with an OAuth Token" + your email + an account table.
  If instead it asks for a `CLOUDFLARE_API_TOKEN`: the monthly OAuth token expired — run `npx wrangler login`, click **Allow** in the browser, and re-check.

## 6. Configure MCP servers

- [ ] **Only one optional server is recommended** (browser automation, so Codex can visually check its own UI work):
  ```bash
  codex mcp add playwright -- npx @playwright/mcp@latest
  ```
  Expected: confirmation that the server was added. Verify with `codex mcp list`.
  *(If `codex mcp` doesn't exist in your version, see [docs/ACCESS_SETUP.md](docs/ACCESS_SETUP.md) §C for the config-file alternative.)*
- [ ] Nothing else to migrate — this project had **no** project-scoped MCP servers under Claude Code.

## 7. Configure environment variables

- [ ] **Nothing is required.** The app reads no env vars; deploys use the Cloudflare OAuth login from step 5. If you later want non-interactive deploys, copy `.env.example` to `.env` and follow its comments (`.env` is gitignored — real values never get committed).

## 8. Run the project

- [ ] ```bash
  cd "/Users/vandrus/Desktop/Scriptica Build"
  python3 -m http.server 5173
  ```
  then open **http://localhost:5173/acasa.html** in your browser.
  Expected: the Scriptica dashboard ("Situații Contabile Noi", "Alerte", "Misiuni de Audit"…) with no errors in the DevTools console. Stop the server later with `Ctrl+C`.

## 9. Run tests

- [ ] There are **no automated tests** (expected — this is a prototype). The equivalent check is a JS syntax sweep:
  ```bash
  cd "/Users/vandrus/Desktop/Scriptica Build"
  for f in js/*.js; do node --check "$f" || echo "FAIL: $f"; done
  ```
  Expected: **no output at all** (silence = every file parses).

## 10. Harmless read-only Cloudflare check

- [ ] ```bash
  npx --yes wrangler pages deployment list --project-name=scriptica | head -8
  ```
  Expected: a table whose top row says `Production │ main` with a recent date. This proves Codex can *see* deployments; it deploys nothing.

## 11. Harmless read-only GitHub check

- [ ] ```bash
  gh repo view vladandrusro/scriptica-build
  ```
  Expected: the repo description/README summary prints. Proves repo access without changing anything.

## 12. Let Codex inspect (but not modify) the project

- [ ] In Codex, ask: *"Read AGENTS.md, docs/ARCHITECTURE.md and docs/CODEX_HANDOFF.md, then explain in plain language how a 'situație contabilă' moves through its three steps, and which files are involved. Don't change anything."*
  Expected: a coherent explanation naming `situatii.html`, `situatie-detaliu.html`, `js/mock-data.js` etc. This confirms it can navigate the codebase and the handoff docs work.

## 13. First small implementation task

- [ ] A safe, genuinely useful starter (fixes real drift found during this migration):
  > *"Two pages reference stale script versions: `situatie-detaliu.html` loads `js/dashboard.js?v=28` while 18 other pages use `?v=30`, and 13 pages load `js/timer.js?v=28` while 6 use `?v=29`. Align every page to the highest version of each file. Follow AGENTS.md: after the change, run the app and confirm zero console errors on acasa.html, situatii.html and situatie-detaliu.html. Do not deploy."*
  Expected: a small find-and-replace diff across HTML files only, plus a verification report.

## 14. Verify commit and rollback procedures

- [ ] Ask Codex to commit the change from step 13 on the current branch (`audit-vertical`):
  ```bash
  git log --oneline -3    # expect the new commit on top
  ```
- [ ] Practice a rollback of that commit (safe — it only moves the branch back):
  ```bash
  git revert --no-edit HEAD   # creates an "undo" commit rather than deleting history
  git log --oneline -3        # expect a "Revert …" commit on top
  ```
  (Or keep the fix and skip the revert — the point is that you've seen both directions.)
- [ ] **Do not push or deploy yet** — pushing (`git push`) and deploying (wrangler) are the two actions Codex must always ask you about first, per [AGENTS.md](AGENTS.md).

---

### When everything above is checked

Codex has: the product context (AGENTS.md), the current state ([docs/CODEX_HANDOFF.md](docs/CODEX_HANDOFF.md)), the architecture ([docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)), working GitHub + Cloudflare access, and a verified dev loop. Continue work from the "Next recommended tasks" list in the handoff doc.
