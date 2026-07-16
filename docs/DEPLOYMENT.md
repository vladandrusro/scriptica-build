# Deployment

> Verified against the live Cloudflare account on 2026-07-16 (`wrangler pages project list` / `deployment list`). No credential values appear in this file.

## Environments

| Environment | URL | How it updates |
|---|---|---|
| Local dev | `http://localhost:5173` | `python3 -m http.server 5173` from the repo root (see [DEVELOPMENT.md](DEVELOPMENT.md)) |
| Production | https://scriptica.vandrus.dev (custom domain) and https://scriptica.pages.dev | **Manual** `wrangler pages deploy` with `--branch=main` |
| Per-deploy preview | `https://<hash>.scriptica.pages.dev` | Created automatically by every deploy; updates instantly |
| Branch preview | `https://<branch>.scriptica.pages.dev` | Created if you deploy **without** `--branch=main` (usually by accident — see gotcha below) |

There is **no CI/CD**. Pushing to GitHub does **not** trigger a deploy (the Pages project is "Direct Upload", Git provider = No). Every release is a manual command run by a human (or by the agent, only when explicitly asked).

## Provider and configuration

- **Provider:** Cloudflare Pages, project name **`scriptica`**, account "Andrus.vlad@gmail.com's Account", account ID `025c5e3f99790f81c11595fd52fd850e` (an identifier, not a secret).
- **There is no `wrangler.toml`.** All configuration is passed as CLI flags. Wrangler's local cache (`.wrangler/`, gitignored) remembers the project/account between runs.
- **Wrangler is not installed globally or as a dependency** — always invoke it via `npx --yes wrangler …` (fetches the latest version; 4.x at the time of writing).
- **No bindings.** There is no KV, D1, R2, Durable Objects, or Functions — the deploy uploads static files only. There are no environment-specific variables in the deployed site.

## Authentication

Wrangler is authenticated via **OAuth token** stored at `~/Library/Preferences/.wrangler/config/default.toml` (machine-local, never in the repo).

- The OAuth token **expires roughly monthly**. Symptom: non-interactive commands fail with "set a CLOUDFLARE_API_TOKEN" or "Failed to fetch auth token: 400".
- Fix: run `npx wrangler login` (it waits on a localhost callback — the user must click "Allow" in the browser), then retry.
- Alternative: a scoped API token in the `CLOUDFLARE_API_TOKEN` environment variable (see [ACCESS_SETUP.md](ACCESS_SETUP.md) §B). Never write the token into any repo file.

Verify identity and access (safe, read-only):

```bash
npx --yes wrangler whoami
npx --yes wrangler pages project list
npx --yes wrangler pages deployment list --project-name=scriptica
```

## The deploy command

Run from the repo root:

```bash
npx --yes wrangler pages deploy . --project-name=scriptica --branch=main --commit-dirty=true
```

### GOTCHA — `--branch=main` is mandatory

The Pages project's production branch is `main`, but **the git branch that contains the current code is `audit-vertical`** (git `main` is a stale pre-audit baseline — see [ARCHITECTURE.md](ARCHITECTURE.md)). Wrangler infers the deploy branch from the checked-out git branch; without `--branch=main` a deploy from `audit-vertical` silently becomes a **Preview** deployment and the live custom domain does not change. This happened on 2026-06-25 and cost real debugging time. Always pass `--branch=main`, then verify:

```bash
npx --yes wrangler pages deployment list --project-name=scriptica | head -8
# The top row must read:  Production │ main │ <your commit>
```

### Pre-deploy checklist

1. All changed JS/CSS files must get a **cache-bust bump**: assets are referenced from HTML as `js/foo.js?v=N` / `css/foo.css?v=N`. Increment `N` in **every HTML page that references the changed file** (there is no build tool doing this — it is manual find-and-replace, and it has drifted before; see CODEX_HANDOFF.md "Technical debt").
2. Commit first when possible (`--commit-dirty=true` allows deploying a dirty tree, but a committed tree gives you a rollback anchor).
3. Deploying to production requires the user's explicit go-ahead — the standing agreement is "the user tells you to deploy and you do it"; never deploy proactively.

### Post-deploy smoke tests

```bash
# per-deploy URL printed by wrangler — reflects the deploy immediately:
curl -sI https://<hash>.scriptica.pages.dev/acasa.html          # expect HTTP 200
# custom domain — may lag a few minutes behind due to CDN caching:
curl -sI https://scriptica.vandrus.dev/acasa.html                # expect HTTP 200
# spot-check that a bumped asset version is being served:
curl -s https://scriptica.vandrus.dev/acasa.html | grep -o 'mock-data.js?v=[0-9]*'
```

Then open the live site in a browser, switch through a couple of personas (avatar menu), and check the DevTools console for errors.

## Rollback

Cloudflare retains all past deployments. Two paths:

1. **Dashboard (preferred, no CLI):** dash.cloudflare.com → Pages → `scriptica` → Deployments → pick the target deployment → **Rollback**.
2. **CLI re-deploy:** `git checkout <known-good-commit>` (or a tag below) in a clean worktree and run the deploy command again.

Known rollback anchors (kept in sync with git tags):

| Anchor | Git ref | Cloudflare deployment ID |
|---|---|---|
| Pre-audit baseline (2026-06-25) | tag `backup-pre-audit-2026-06-25` = `main` @ `beaa2de` | `59949a8d-fa4c-47ac-84f6-f874a01c1140` (commit `71dd538`) |
| Pre-design-pass (2026-07-09) | tag `live-2026-07-09-pre-design-pass` = `1ea9aae` | `bed2541a` |

`wrangler pages deployment list` shows the full history with commit hashes — the "Source" column tells you which commit each deployment came from.

## Logs and debugging

A static Pages site has no server logs. Debugging is client-side:

- Browser DevTools console + Network tab on the live URL.
- `npx wrangler pages deployment list` to confirm what is actually live.
- If the custom domain shows stale content but the `<hash>.scriptica.pages.dev` URL is correct, it is CDN cache lag — wait a few minutes or hard-reload.

## Actions that require explicit user approval

- Any production deploy or rollback.
- `npx wrangler login` (interactive; the user must click Allow).
- Deleting deployments or changing the Pages project / custom domain settings.
- `git push` (see [ACCESS_SETUP.md](ACCESS_SETUP.md) §A).

Read-only commands (`whoami`, `project list`, `deployment list`, `curl` against public URLs) are safe to run without asking.
