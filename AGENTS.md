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
- **Query builders**: Knex (migrations/seeds) + Kysely (app queries)
- **ORM**: Objection.js (legacy; phase out)
- **Validation**: Zod + fastify-type-provider-zod
- **Session**: @fastify/session + Redis
- **Testing**: Vitest
- **Language**: TypeScript (ES2022 modules)

## Migration: Objection.js → Kysely

Slow transition Objection.js → Kysely. Rules:

- New queries: **Kysely only**, never Objection.js models.
- No new Objection.js models (`src/api/models/`). Existing models = legacy only.
- New schemas: **Zod schemas** in `src/api/schemas/`. Use for request validation + response typing.
- New API endpoints: Zod schemas for body, params, query, response via `fastify-type-provider-zod`.
- DB column types: `src/types/db.types.ts` for Kysely type system.

## Code Patterns

- **Controllers**: static class methods; use `req.session.user` for scoping
- **Multi-tenancy**: scope all data queries by `req.session.user.user_id` (company)
- **Auth guards**: `Guard.authorize([ROLES.admin])` in route `onRequest` hooks
- **Migrations**: Knex files in `db/migrations/`, ES module exports (`export function up/down`)
- **Schemas**: Zod schemas in `src/api/schemas/` for all request/response validation
- **Types**: DB types in `src/types/db.types.ts`
