# Copilot Instructions — btree_server

## Domain Context

This is a **beekeeping SaaS** backend. The naming uses bee-keeping metaphors:

- **`bees`** table = actual user accounts (beekeepers)
- **`companies`** table = workspaces/organizations
- **`company_bee`** = M:N junction table linking users to companies with a permission `rank`

## Critical: Foreign Key Naming Convention

> **`user_id` always references `companies.id`**, NOT `bees.id`.
> **`bee_id` always references `bees.id`** (the actual user).

This is counter-intuitive but consistent across the entire codebase. When creating new tables or migrations, always follow this pattern:

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

The authenticated session (`req.session.user`) contains:

| Field       | Meaning                          | FK target       |
|-------------|----------------------------------|-----------------|
| `bee_id`    | Logged-in user's ID              | `bees.id`       |
| `user_id`   | Active company/workspace ID      | `companies.id`  |
| `rank`      | Permission level in that company | —               |

## Permission Ranks (`company_bee.rank`)

| Rank | Role       |
|------|------------|
| 1    | Admin      |
| 2    | User       |
| 3    | Read-only  |

## Tech Stack

- **Server**: Fastify v5
- **Database**: MariaDB (mysql2)
- **Query builders**: Knex (migrations/seeds) + Kysely (application queries)
- **ORM**: Objection.js (legacy — being phased out)
- **Validation**: Zod + fastify-type-provider-zod
- **Session**: @fastify/session + Redis
- **Testing**: Vitest
- **Language**: TypeScript (ES2022 modules)

## Migration: Objection.js → Kysely

The codebase is in a **slow transition from Objection.js ORM to Kysely**. Follow these rules:

- **All new queries** must use **Kysely**, never Objection.js models.
- **Do not create new Objection.js models** (`src/api/models/`). Existing models are legacy only.
- **All new schemas** must be **Zod schemas** in `src/api/schemas/`. Use these for both request validation and response typing.
- **All new API endpoints** must have Zod schemas for request body, params, query, and response validation via `fastify-type-provider-zod`.
- DB column types live in `src/types/db.types.ts` (used by Kysely's type system).

## Code Patterns

- **Controllers**: static methods on classes, access `req.session.user` for scoping
- **Multi-tenancy**: all data queries must be scoped by `req.session.user.user_id` (company)
- **Auth guards**: `Guard.authorize([ROLES.admin])` in route `onRequest` hooks
- **Migrations**: Knex migration files in `db/migrations/`, ES module exports (`export function up/down`)
- **Schemas**: Zod schemas in `src/api/schemas/` for all request/response validation
- **Types**: DB types in `src/types/db.types.ts`
