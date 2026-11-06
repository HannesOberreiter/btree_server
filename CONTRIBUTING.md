# Contributing

Thank you for your interest in b.tree. Bug reports, ideas and pull requests are welcome.

## Before you start

- For a bug or an idea, open an [issue](https://github.com/HannesOberreiter/btree/issues/new/choose).
- For a security problem, read [SECURITY.md](SECURITY.md). Do not open a public issue.
- For a bigger change, open an issue first, so that we can agree on the approach before you write the code.
- For questions about your account, write to office📧btree.at.

## Development

This repository holds two apps. Each app is a separate pnpm project with its own lockfile, so run pnpm commands inside the app directory.

- [`apps/server`](apps/server): the API server. Setup: [`apps/server/readme.md`](apps/server/readme.md).
- [`apps/web`](apps/web): the web app (PWA). Setup: [`apps/web/README.md`](apps/web/README.md).

## Pull requests

1. Fork the repository and create a branch from `beta`.
2. Make your change. Keep one topic per pull request.
3. Run lint and the tests of the app that you changed.
4. Open the pull request against `beta`.

The pull request title becomes the commit message and the changelog entry. Write it as a [Conventional Commit](https://www.conventionalcommits.org/), for example `fix(web): show the hive name in the calendar`. These types start a release of the changed app: `feat`, `fix`, `perf`, `chore`, `refactor`, `style`. These types do not: `build`, `ci`, `docs`, `test`.

CI must pass before a merge. It runs lint, type checks, builds, the server tests, the Playwright end-to-end tests, a secret scan and a licence check.

## Compatibility

- Keep the API backwards compatible. Cached web app versions, the native apps, MCP clients and WizBee use older versions of the API.
- Keep database migrations additive. During a deploy, the previous server version still runs against the new schema.
- After you change the HTTP API, run `pnpm api:update` in `apps/web` against your local server, and commit `apps/web/src/api/generated/schema.d.ts` in the same pull request.

## Licence

b.tree is licensed under the [GNU Affero General Public License v3.0](LICENSE). By contributing, you agree that your contribution is licensed under the same licence.
