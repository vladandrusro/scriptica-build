# Access setup for Codex on this machine

How to give OpenAI Codex the same access Claude Code had, without ever placing a credential in a repo file. Written for the project owner (a designer, not a developer) — every step says what it does and how to check it worked.

> Facts below (remote URL, auth methods, account IDs) were verified on this machine on 2026-07-16. No credential values appear in this file.

---

## A. Git and GitHub

**Current state on this machine (verified):**

- Remote: `origin = https://github.com/vladandrusro/scriptica-build.git` (HTTPS, not SSH).
- Auth: **GitHub CLI (`gh`)**, logged in as **`vladandrusro`**, token stored in the macOS **keychain**; plain `git push/pull` also works because git's credential helper is `osxkeychain`.
- Token scopes: `repo`, `read:org`, `gist` — `repo` is the one that matters (push/pull on this repository). That is already least-privilege enough for a personal repo.
- Commit identity comes from `~/.gitconfig`: name `vlad`, email `andrus.vlad@gmail.com`.

**Verify authentication (safe, read-only):**

```bash
gh auth status          # expect: "Logged in to github.com account vladandrusro"
git -C "/Users/vandrus/Desktop/Scriptica Build" fetch --dry-run   # expect: no error, no password prompt
```

**If auth is ever missing (e.g. new machine):**

```bash
gh auth login
# choose: GitHub.com -> HTTPS -> "Login with a web browser" -> follow the code prompt
```

This is interactive on purpose — you approve in the browser and no token is ever typed or stored in files.

**Branch / PR workflow for this repo:**

- `main` = the **pre-audit baseline**, 22 commits behind — treat it as an archive, do not build on it.
- `audit-vertical` = the current working branch; all new work continues here (or on new feature branches cut from it).
- There is no PR review process today (single owner, direct pushes). If Codex proposes using PRs for bigger changes, that's a reasonable upgrade — but pushing directly to `audit-vertical` after your approval matches current practice.

**Commands Codex may run without asking:** `git status`, `git log`, `git diff`, `git branch`, `git fetch`, `gh pr list/view`, and local commits on a feature branch when you asked for the change.

**Commands that need your explicit approval each time:** `git push` (anything leaving the machine), `gh pr create/merge`, tag creation/deletion, anything rewriting history (`rebase`, `reset --hard`, `push --force`), and any change on the `main` branch.

---

## B. Cloudflare

**Current state (verified):**

- Product: **Cloudflare Pages**, project **`scriptica`**, serving https://scriptica.vandrus.dev + https://scriptica.pages.dev.
- Account: "Andrus.vlad@gmail.com's Account", account ID `025c5e3f99790f81c11595fd52fd850e` (an identifier — safe to write down).
- Auth: **Wrangler OAuth token** at `~/Library/Preferences/.wrangler/config/default.toml`, created by `npx wrangler login`. **It expires roughly monthly.**

**Two ways to authenticate Codex's environment — pick one:**

1. **OAuth (same as today, simplest):** when a wrangler command fails with "set a CLOUDFLARE_API_TOKEN", run:
   ```bash
   npx --yes wrangler login
   ```
   A browser window opens; you click **Allow**. Nothing to store in the repo; the token lands in wrangler's own config file. Re-do this whenever it expires.

2. **Scoped API token (survives longer, works non-interactively):**
   - Cloudflare dashboard → My Profile → **API Tokens** → Create Token.
   - Permission: **Cloudflare Pages — Edit**, scoped to only this account (least privilege — do *not* use the "Global API Key").
   - Put it in your shell environment, **not in any file inside the repo**: e.g. add `export CLOUDFLARE_API_TOKEN=…` to `~/.zshrc` (your private home-directory file), or keep a local `.env` (gitignored) and `source` it manually.

**Verify identity and project access (safe, read-only):**

```bash
npx --yes wrangler whoami                                        # expect your email + account table
npx --yes wrangler pages project list                            # expect a row: scriptica
npx --yes wrangler pages deployment list --project-name=scriptica # expect deployment history
```

**Safe deployment / rollback commands:** see [DEPLOYMENT.md](DEPLOYMENT.md) — deploy is `npx --yes wrangler pages deploy . --project-name=scriptica --branch=main --commit-dirty=true` (production deploys always need your explicit go-ahead), rollback is via the Cloudflare dashboard's Deployments → Rollback button.

---

## C. MCP servers

**Good news: there is nothing to migrate.** This repository has **no** `.mcp.json` and no project- or user-scoped MCP servers configured for it (verified in `~/.claude.json` — both lists are empty). The MCP tools Claude Code used here (browser preview pane, session tools, visualization) are **built into the Claude Code app itself**, are not configuration you own, and have no direct Codex equivalent.

**What Claude's built-in browser preview did for this project** — started `python3 -m http.server 5173` and visually verified pages after UI changes. To give Codex the same capability, you have two options:

1. **Manual (zero setup):** Codex runs the server and you look at `http://localhost:5173` yourself when it asks you to verify.
2. **Playwright MCP server (recommended, lets Codex look at pages itself):**
   ```bash
   codex mcp add playwright -- npx @playwright/mcp@latest
   ```
   If your Codex version lacks `codex mcp add`, add this to `~/.codex/config.toml` instead:
   ```toml
   [mcp_servers.playwright]
   command = "npx"
   args = ["@playwright/mcp@latest"]
   ```
   No environment variables and no authentication are required for it.

**Verify:** run `codex mcp list` (or ask Codex "what MCP tools do you have?") — `playwright` should appear. First use will download a browser build (~100 MB), which is normal.

No other MCP servers are needed: GitHub and Cloudflare are handled by their CLIs (`gh`, `npx wrangler`), which Codex can run as normal shell commands.

---

## D. Other services

- **Google Fonts** (`fonts.googleapis.com` — Lato + Material Symbols): loaded by the app at runtime. No account, no auth, nothing to configure.
- **i.pravatar.cc** (placeholder avatar photos, with a built-in initials fallback): runtime-only, no account, nothing to configure.
- **app.scriptica.ro** (the real production platform this prototype references): explicitly **out of scope** — the prototype only adapted *ideas* from its admin panel. Codex needs no access to it and should not attempt any.
- There are no analytics, no error tracking, no databases, no email services, and no other third-party integrations.

---

## Summary table

| Service | Auth method | Where the credential lives | Renewal |
|---|---|---|---|
| GitHub | `gh` CLI OAuth (account `vladandrusro`) | macOS keychain | rarely; `gh auth login` |
| Cloudflare | Wrangler OAuth (or scoped API token) | `~/Library/Preferences/.wrangler/config/default.toml` (or shell env) | ~monthly; `npx wrangler login` |
| Google Fonts | none | — | — |
