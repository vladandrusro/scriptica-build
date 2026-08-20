# Integrations and MCP inventory

Complete inventory of every external integration and every piece of Claude-Code-specific configuration found for this project, with the Codex migration path for each. Inspected on 2026-07-16: the repo (no `.mcp.json` exists), `.claude/` (only `launch.json` + `settings.local.json`), and the user-level Claude config (`~/.claude.json` — **zero MCP servers configured at either user or project scope**). No secret values appear in this file.

## 1. External services the project actually uses

### GitHub
- **Purpose:** source hosting and cross-machine sync (`origin`).
- **Configured in:** git remote (repo-scoped); auth in macOS keychain via `gh` CLI (user-scoped).
- **URL:** https://github.com/vladandrusro/scriptica-build (private ownership: `vladandrusro`).
- **Env vars:** none (keychain-based).
- **Permissions needed:** `repo` scope (already granted).
- **Authenticate:** `gh auth login` → browser flow. **Verify:** `gh auth status`, `git fetch --dry-run`.
- **Exposes to the agent:** normal `git`/`gh` shell commands — no MCP server involved, works identically under Codex.
- **Migration difference:** none.

### Cloudflare Pages
- **Purpose:** production hosting (project `scriptica` → scriptica.vandrus.dev + scriptica.pages.dev). Manual direct-upload deploys; no Git integration, no CI.
- **Configured in:** nothing in the repo (no wrangler.toml). Wrangler's machine-local cache `.wrangler/` (gitignored) remembers project/account; OAuth token lives in `~/Library/Preferences/.wrangler/config/default.toml` (user-scoped, expires ~monthly).
- **Command:** `npx --yes wrangler …` (wrangler is not installed as a dependency).
- **Env vars (optional alternative to OAuth):** `CLOUDFLARE_API_TOKEN` (secret), `CLOUDFLARE_ACCOUNT_ID` (identifier) — see [.env.example](../.env.example).
- **Permissions:** "Cloudflare Pages — Edit" on the one account is sufficient (least privilege).
- **Authenticate:** `npx wrangler login` (interactive browser Allow). **Verify:** `npx wrangler whoami`, `npx wrangler pages project list`.
- **Migration difference:** none — plain CLI, no MCP.

### Google Fonts (runtime, no account)
- **Purpose:** Lato font + Material Symbols Outlined icon font, loaded from `fonts.googleapis.com`/`fonts.gstatic.com` in every page `<head>`.
- **Configured in:** the HTML pages themselves (repo-scoped).
- **Auth/env:** none. **Verify:** icons render as icons, not as ligature text like `description`.

### i.pravatar.cc (runtime, no account)
- **Purpose:** placeholder avatar photos (`https://i.pravatar.cc/<size>?img=<id>`), with a colored-initials fallback baked into `js/shell.js` if the request fails.
- **Configured in:** `js/shell.js` (`renderAvatar`). Auth/env: none. Nothing to migrate.

### app.scriptica.ro — explicitly NOT an integration
The real production platform. Reference-only for ideas; the prototype has no connection to it and the agent needs no access.

There are **no** analytics, error tracking, databases, email services, payment providers, or other third-party integrations.

## 2. Claude-Code-specific configuration found (and what happens to it)

| Item | Scope | What it is | Codex migration |
|---|---|---|---|
| `.claude/launch.json` | repository | Dev-server definition for Claude's preview pane: `python3 -m http.server 5173`, port 5173 | No direct equivalent needed — the command itself is documented in AGENTS.md/DEVELOPMENT.md; Codex just runs it in a shell. Keep the file (harmless, other Claude Code sessions may still use it). |
| `.claude/settings.local.json` | repository-local (gitignored) | Permission allowlist accumulated during Claude sessions (wrangler, gh, curl of the live site, etc.) | Not transferable and not needed. Codex has its own approval model (sandbox + approval modes). The list is useful only as evidence of which commands are routine: `npx wrangler *`, `gh auth/repo *`, `git add/push`, `curl` against localhost:5173 and scriptica.vandrus.dev. |
| Claude auto-memory (`~/.claude/projects/-Users-vandrus-Desktop-Scriptica-Build/memory/`) | user | 10 memory files holding project history/decisions | **Migrated**: their durable content is now in AGENTS.md + docs/CODEX_HANDOFF.md + docs/DEPLOYMENT.md. Codex does not read Claude memory. |
| CLAUDE.md | — | **Does not exist** (neither repo nor user level) | Nothing to migrate; AGENTS.md is now the canonical agent instruction file. |
| Hooks / slash commands / project skills | — | **None project-scoped.** (A user-level SessionStart hook from a personal "watch" plugin prints a video-tooling message; it is unrelated to Scriptica.) | Nothing to migrate. No hook behavior needs a Codex equivalent. |
| Claude Code built-in MCP servers (browser preview pane, computer-use, session tools, visualization, scheduled tasks) | Claude app internals | Tooling that ships inside Claude Code itself — **not user configuration**. For this project, only the browser preview mattered (running the dev server + visually verifying pages). | Cannot be transferred. Functional replacement: the optional Playwright MCP server below, or manual browser checks. |

## 3. MCP server mapping (Claude → Codex)

**There are no user- or project-configured MCP servers to migrate.** Verified: no `.mcp.json` in the repo; `mcpServers` is empty at both scopes in `~/.claude.json`.

The only *functional* gap when leaving Claude Code is automated in-browser verification (AGENTS.md requires visually inspecting UI changes). Recommended (optional) Codex configuration:

| | Claude Code | Codex equivalent |
|---|---|---|
| Server | built-in browser/preview pane (not configurable) | **Playwright MCP** |
| Purpose | open localhost:5173, read pages, screenshot, check console | same |
| Executable | — | `npx @playwright/mcp@latest` |
| Arguments | — | none required |
| Env var names | — | none |
| Auth | — | none |
| Configure | — | `codex mcp add playwright -- npx @playwright/mcp@latest`, or in `~/.codex/config.toml` (user scope):<br>`[mcp_servers.playwright]`<br>`command = "npx"`<br>`args = ["@playwright/mcp@latest"]` |
| Verify | — | `codex mcp list` shows `playwright`; then ask Codex to open http://localhost:5173/acasa.html and report the page title (dev server must be running) |

If you skip this, the fallback workflow is: Codex runs the dev server and asks you to look at specific pages — workable, just slower.

## 4. Verification checklist for all integrations

```bash
gh auth status                                      # GitHub: logged in as vladandrusro
git -C "/Users/vandrus/Desktop/Scriptica Build" fetch --dry-run   # remote reachable
npx --yes wrangler whoami                           # Cloudflare: OAuth valid
npx --yes wrangler pages project list               # sees project 'scriptica'
curl -sI https://scriptica.vandrus.dev/acasa.html   # live site: HTTP 200
codex mcp list                                      # (optional) playwright listed
```
