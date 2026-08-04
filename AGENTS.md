# Copilot Instructions — btree_server

## Domain Context

**Beekeeping SaaS** backend. Naming use beekeeping metaphors:

- **`bees`** table = real user accounts (beekeepers)
- **`companies`** table = workspaces/organizations
- **`company_bee`** = M:N link users↔companies with permission `rank`

## Critical: Foreign Key Naming Convention

> **`user_id` always references `companies.id`**, NOT `bees.id`.
> **`bee_id` always references `bees.id`** (real user).

Counter-intuitive but codebase-wide. New tables/migrations must follow:

```js
t.integer('user_id').unsigned().nullable();
t.foreign('user_id')
  .references('companies.id') // ← company, NOT bees
  .onDelete('SET NULL')
  .onUpdate('CASCADE');

t.integer('bee_id').unsigned().nullable();
t.foreign('bee_id')
  .references('bees.id') // ← actual user
  .onDelete('SET NULL')
  .onUpdate('CASCADE');
```

## Session Object

Authenticated session (`req.session.user`):

| Field     | Meaning                          | FK target      |
| --------- | -------------------------------- | -------------- |
| `bee_id`  | Logged-in user's ID              | `bees.id`      |
| `user_id` | Active company/workspace ID      | `companies.id` |
| `rank`    | Permission level in that company | —              |

## Permission Ranks (`company_bee.rank`)

| Rank | Role      |
| ---- | --------- |
| 1    | Admin     |
| 2    | User      |
| 3    | Read-only |

## Tech Stack

- **Server**: Fastify v5
- **Database**: MariaDB (mysql2)
- **Database tooling**: Knex (migrations, seeds, test setup) + Kysely (application persistence)
- **Validation**: Zod + fastify-type-provider-zod
- **Session**: @fastify/session + Redis
- **Testing**: Vitest
- **Language**: TypeScript (ES2022 modules)

## Persistence

- Application queries use **Kysely only**.
- Pass explicit `Database` dependencies into shared domain operations.
- Knex remains tooling for migrations, seeds, and test database setup.
- Schemas use **Zod** in `src/api/schemas/` for request validation and response typing.
- HTTP endpoints define Zod body, params, query, and response schemas through `fastify-type-provider-zod`.
- Generated database column types live in `src/types/db.types.ts`.

## Code Patterns

- **Controllers**: static class methods; use `req.session.user` for scoping
- **Multi-tenancy**: scope all data queries by `req.session.user.user_id` (company)
- **Auth guards**: `Guard.authorize([ROLES.admin])` in route `onRequest` hooks
- **Migrations**: Knex files in `db/migrations/`, ES module exports (`export function up/down`)
- **Schemas**: Zod schemas in `src/api/schemas/` for all request/response validation
- **Types**: DB types in `src/types/db.types.ts`
