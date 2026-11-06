# b.tree

Monorepo of the b.tree beekeeping app. Each app is a separate pnpm project with its own lockfile, so run pnpm commands inside the app directory.

- `apps/server`: the API server. Read `apps/server/AGENTS.md` before you change it.
- `apps/web`: the web app (PWA). Read `apps/web/AGENTS.md` before you change it.

## Branches and PRs

- `beta` is the default branch. Branch from `beta`, and open the PR against `beta`. Rulesets block direct pushes to `beta` and `main` for everybody.
- PRs to `beta` are squash merged. The PR title becomes the commit on `beta` and the changelog entry, so write it as a Conventional Commit.
- release-please assigns a commit to an app by its changed paths. `feat`, `fix`, `perf`, `chore`, `refactor` and `style` start a release of that app; `build`, `ci`, `docs` and `test` do not.
- `main` gets only PRs from `beta` (merge commit) and the release-please PR. The CI job `pull-protection` enforces this.
- A merge to `beta` deploys beta.btree.at and the `beta` server image. A release on `main` deploys production.

## CI

- `.github/workflows/ci.yml` runs on every PR. Jobs that the changed paths do not need are skipped and count as passed. All jobs are required checks, also `e2e`. `pull-protection` is required only for PRs to `main`.
- `.github/workflows/pr-title.yml` checks that the title of a PR to `beta` is a Conventional Commit. It is a required check.
- Dependabot opens grouped update PRs to `beta` once a month (`.github/dependabot.yml`). Production dependencies get `fix(deps)` and release the app; development dependencies get `build(deps-dev)`.
- After an HTTP contract change in `apps/server`, run `pnpm api:update` in `apps/web` against the server of the branch, and commit `apps/web/src/api/generated/schema.d.ts` in the same PR. The `server` job fails when the file differs.
- `ai-review` reviews a PR against `beta` once when it opens. Add the label `ai-review` for another review. The workflow reads `.github/ai-review/` from the PR base, so a change to it takes effect after the merge.

## Quasar MCP

The `quasar` MCP server is configured in `.mcp.json` at the repository root. Start the agent from the repository root to load it. Usage is in `apps/web/AGENTS.md`.
