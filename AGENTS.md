<!-- bmad:context -->
<!-- Verified 2026-09-14 against ddebf465e1e06c3cc9c0873334bbe304c2057580. Managed by bmad-project-context; refreshes reconcile existing instructions before replacing this block. -->

## b.tree server

Beekeeping SaaS backend using Fastify 5, TypeScript ES2022 modules, and MariaDB/mysql2.
Sessions use @fastify/session with Redis; E2E tests use Vitest.
This repository owns application schema migrations and the HTTP and agent-facing APIs.

## Policy

- Work with `beta` checked out. Update `main` only through pull requests from `beta`, except for the existing automated release-please PRs. Never commit directly or merge locally into `main`.
- Regenerate `src/types/db.types.ts` with `pnpm run db:types`; do not hand-edit it.
- Run E2E and `dev:init` only against disposable databases; test setup migrates and truncates non-CI tables, and seeding deletes existing fixture data.

## Where things are

- Coordinate frontend changes with `HannesOberreiter/btree_vue`, documentation with `HannesOberreiter/btree_sites`, and database infrastructure with `HannesOberreiter/btree_database`.
- Start at `src/app.bootstrap.ts`; HTTP contracts live in `src/api/routes/` and `src/api/schemas/`, and shared domain operations live in `src/api/modules/`.
- Keep application migrations in `db/migrations/`, using Knex ES module `up`/`down` exports.
- For HTTP contract changes, coordinate frontend declarations in `HannesOberreiter/btree_vue` using `pnpm api:update` against this server's `/api/v1/openapi.json`, not an agent-specific specification.

## Running and verifying

- Use Node 22 and pinned pnpm 11.4.0.
- Run `pnpm run build` before Knex commands, development serving, or E2E; they consume `dist`. Keep `pnpm run dev:build` running when serving changing TypeScript.
- Provide MariaDB, Redis, and the selected environment file before E2E; `pnpm run test:e2e` starts the compiled server itself. Do not start another backend on its port.
- Keep E2E serial; tests share a database managed by global setup.
- Run lint separately from CI's build/E2E checks; `pnpm run lint` checks, while `pnpm run lint:fix` writes.
- Use the DB type wrapper rather than bare codegen; it normalizes tinyint and Decimal types. It defaults to `env/development.env`; its positional environment argument does not inherit runtime `SERVER` selection.

## Conventions that differ from defaults

- Treat `bees` as beekeeper accounts, `companies` as workspaces, and `company_bee` as their ranked many-to-many membership.
- Keep `user_id` referencing `companies.id`, never `bees.id`; keep `bee_id` referencing `bees.id`, including in new migrations.
- Keep these identity references unsigned. Choose nullability and deletion behavior for the relationship: nullable links can use `SET NULL`, while owned records may require non-null links and cascading deletion. Preserve `CASCADE` on update.
- Read `req.session.user.bee_id` as the authenticated account, `user_id` as its active workspace, and `rank` as permission in that workspace. Preserve admin=1, user=2, read-only=3; consult `ROLES` for other declared values.
- Scope company-owned queries by the session's `user_id`, or the explicit company actor derived from it; scope account-owned queries to the account.
- Use Kysely only for application queries. Pass explicit `Database` dependencies into shared operations; reserve Knex for migrations, seeds, and test database setup. Keep HTTP and WizBee/internal callers on shared operations.
- Put thin HTTP adapters in typed route modules. Keep static controller methods for substantial transport-specific behavior; derive authenticated scope from the session.
- Authorize protected routes with `Guard.authorize` and explicit permitted `ROLES`; follow the route family's hook phase rather than forcing every guard into `onRequest`.
- Define applicable HTTP body, params, query, and response schemas with Zod in `src/api/schemas/`, using `fastify-type-provider-zod` for validation and response typing.

<!-- /bmad:context -->
