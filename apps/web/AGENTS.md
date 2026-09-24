<!-- bmad:context -->
<!-- Verified 2026-09-14 against 44299599e3f7249556cf9edf9049ee41619f2164. Managed by bmad-project-context; refreshes reconcile existing instructions before replacing this block. -->

## b.tree

b.tree is a beekeeping management application built with Vue and Quasar.
It ships as a PWA, with separate Android TWA packaging.
Deployment and Android packaging documentation lives in `README.md`.

## Policy

- Work with `beta` checked out. Update `main` only through pull requests from `beta`, except for the existing automated release-please PRs. Never commit directly or merge locally into `main`.
- Run `pnpm lint:check` and `pnpm typecheck` before committing. Use `pnpm lint` for formatting and lint fixes, and review all automatic changes manually.
- Before changing the manifest or service-worker behavior, agree on TWA compatibility checks with the maintainer. A successful PWA build alone does not validate Android compatibility.

## Where things are

- For cross-repository changes, coordinate with `HannesOberreiter/btree_server` for the backend, `HannesOberreiter/btree_sites` for documentation, and `HannesOberreiter/btree_database` for database infrastructure.
- For backend requests, start with `src/composables/useApi.ts` and `src/composables/useBackend.ts`; query integration lives in `src/composables/useQuery.ts`.
- For API contract changes, use `src/api/types.ts` and regenerate `src/api/generated/schema.d.ts` with `pnpm api:update`; do not hand-edit the generated schema.
- For authenticated E2E tests, use `test/playwright/support/user-helpers.ts`; authentication runs per test, not through a shared setup project.
- For Android packaging changes, read the TWA section of `README.md` and check `public/.well-known/assetlinks.json`.

## Running and verifying

- Use the declared Node range `^28 || ^26 || ^24 || ^22` and pinned pnpm `11.5.3` from `package.json`; CI uses Node 22.
- For local setup, copy `example.env` to `.env`, but set `BACKEND_URL` to an absolute backend URL ending in `/api`, using the actual backend port.
- Make the backend available before exercising API flows or E2E tests. For local backend setup, follow the README in `HannesOberreiter/btree_server`.
- Use `pnpm test:e2e`, not `pnpm test`, which exits successfully without testing. Start the frontend and backend yourself; Playwright starts neither.
- For E2E runs, export matching `BACKEND_URL`, `PLAYWRIGHT_BACKEND_URL`, and `PLAYWRIGHT_API_ORIGIN` values in the shell; Playwright does not load `.env`. `BACKEND_URL` includes `/api`; `PLAYWRIGHT_BACKEND_URL` is the backend origin. Keep the frontend on `localhost` for the authenticated fixture's cookie; the default frontend URL is `http://localhost:9000`.
- When PWA dependencies are missing, run `pnpm --dir src-pwa install`; the root install does not include that separate package.
- For API regeneration against a different backend, set `BTREE_OPENAPI_URL`; the generator defaults to `http://localhost:8101/api/v1/openapi.json`.

## Conventions that differ from defaults

- Use `useApiFetch` for ordinary backend requests so credentials, loading, and error handling remain centralized. Keep backend URL selection in `useBackend`; never hard-code backend URLs in components.
- Treat US backend support as disabled in the current configuration. If enabling it, update backend environment exposure and the matching development proxy together.
- Prefer composables for new shared logic and state; keep existing Pinia-managed authentication and company state integrated with their stores.
- Add UI translation keys to all four locales under `src/i18n/`: `de`, `en`, `fr`, and `it`.
- Prefer `@/` imports for `src/` and `~@/assets/...` for Vue template asset URLs.
- Use `#q-app` wrappers such as `defineBoot` and `defineRouter`. Use `import.meta.env.QUASAR_*` for Quasar constants rather than `process.env`.
- When adding external requests, images, scripts, or frames, check the matching CSP directive in `quasar.config.ts`; CSP enforcement is disabled during development.

<!-- /bmad:context -->

## Quasar MCP

- For Quasar documentation and component APIs, prefer the `quasar` MCP server configured in `.mcp.json`; it reads version-matched documentation from the installed packages. Use `search_docs` and `get_page` for documentation, and `get_api` for component APIs.
- Start the agent from this directory to load the project-local MCP configuration. The first server download requires internet; cached startup and bundled documentation work offline.
- The pinned `@quasar/app-vite` release does not bundle documentation. Quasar UI documentation and component APIs are available; app-vite documentation requires a separately approved upgrade.
