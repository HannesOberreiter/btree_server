# Objection.js to Kysely migration

## Rules

- Preserve existing HTTP wire shapes unless a slice explicitly changes server and Vue together.
- Keep company scoping (`user_id`) on every applicable query.
- Keep application-managed UTC timestamps during the migration.
- Use domain operation modules when HTTP and WizBee/internal callers share behavior.
- Put thin HTTP adapter functions directly in typed route modules.
- Delete pass-through controllers when the deletion test only moves a few adapter lines into the route.
- Keep controllers only when they hide substantial transport-specific implementation such as streams or downloads.
- Pass `Kysely<DB> | Transaction<DB>` into operations; avoid hidden database lookups.
- Do not add pass-through repository classes.
- Do not add generic dynamic sorting/filtering helpers that require `any`.
- Delete an Objection model only after its final caller is migrated.
- Commit and deploy route families independently.

## Baseline

- [x] Server E2E: 530 tests
- [x] Vue Playwright E2E: 42 tests
- [x] OpenAPI request schemas available for route contracts
- [x] Make `src/types/db.types.ts` generation reproducible with `pnpm db:types`
- [x] Add Todo response-shape and tenant-isolation characterization tests
- [ ] Add response-shape and tenant-isolation characterization tests for each later slice

## Phase 0: migration foundation

- [x] Harden Todo as reference Kysely slice
- [x] Remove Todo query and mutation `any` casts
- [x] Add Todo sort/filter allowlists
- [x] Move shared Todo behavior behind a domain operation module
- [x] Make HTTP, WizBee, and Hive Todo adapters call the same operations
- [x] Delete the shallow Todo controller and keep its HTTP adapters in the typed route
- [x] Add typed application-managed UTC timestamp helpers
- [ ] Replace broad Kysely helpers with narrow typed helpers as slices need them
- [ ] Define native MySQL/Kysely error mapping before removing Objection errors

## Phase 1: leaf and read-only slices

- [ ] Field Settings
  - [x] Route reads/writes use typed Kysely operations
  - [x] Shallow controller removed
  - [ ] Remove model after `delete.util.ts` migrates
- [ ] Dropbox
  - [x] Route persistence uses typed Kysely operations
  - [x] OAuth implementation moved to a transport adapter
  - [x] Shallow controller removed
  - [ ] Remove model after `delete.util.ts` and `cron.util.ts` migrate
- [x] Agent Key model wrapper
  - [x] Kysely operations accept explicit database dependency
  - [x] HTTP route and authentication hook use shared operations
  - [x] Shallow controller and model wrapper removed
- [ ] Options
  - [x] HTTP CRUD uses typed Kysely operations
  - [x] WizBee option reads use shared operations
  - [x] Favorite resets and inserts remain transactional
  - [x] Charge stock relation and option response shapes covered
  - [x] Tenant isolation covered across all option tables
  - [x] Shallow controller removed
  - [ ] Remove models after task, Company, autofill, delete, and cron callers migrate
- [x] Public observations
  - [x] Reads, ingestion, deduplication, sampling, and cleanup use typed Kysely operations
  - [x] Public cache adapter retains Redis behavior and concrete response schemas
  - [x] Pest import adapters pass an explicit database dependency
  - [x] Observation model wrapper removed
- [x] Calendar views
  - [x] Task, movement, Todo, Scale Data, and Rearing reads use typed Kysely operations
  - [x] HTTP and external iCal adapters share calendar operations
  - [x] Calendar response shapes and tenant isolation covered
  - [x] Shallow calendar controller and Objection/Knex utility removed
- [x] Statistic views
  - [x] Hive counts, task aggregates, ratings, and Varroa reads use typed Kysely operations
  - [x] HTTP and WizBee adapters share statistic operations
  - [x] Dynamic filters and sorting use typed allowlists
  - [x] Statistic response shapes and tenant isolation covered
  - [x] Shallow statistic controller and Knex utility removed

## Phase 2: core location slices

- [ ] Apiary
  - [x] HTTP CRUD and detail reads use typed Kysely operations
  - [x] WizBee Apiary reads and writes use shared operations
  - [x] Duplicate-name checks and delete decisions remain transactional
  - [x] Nested counts, detail shape, restore/hard-delete, and tenant isolation covered
  - [x] Shallow Apiary controller removed
  - [ ] Remove model after Hive, Movedate, Service, Company, autofill, delete, and cron callers migrate
- [ ] Hive
  - [x] HTTP CRUD, detail, status, position, and delete operations use typed Kysely
  - [x] WizBee Hive CRUD and detail use shared operations
  - [x] Sorting and filtering use typed domain allowlists
  - [x] Nested response shapes and tenant isolation covered
  - [x] Shallow controller reduced to the task aggregate pending task-slice migration
  - [ ] Migrate task aggregate after Feed, Harvest, Treatment, and Checkup operations exist
  - [ ] Remove model after task aggregate and remaining cross-cutting callers migrate
- [ ] Movedate

## Phase 3: task slices

- [ ] Feed
- [ ] Harvest
- [ ] Extract shared task implementation only after Feed and Harvest prove the seam
- [ ] Treatment
- [ ] Checkup

## Phase 4: other business slices

- [ ] Charge and Charge Stock
- [ ] Scale and Scale Data
  - [x] Scale routes use typed Kysely operations
  - [x] Scale ownership, nested Hive response, and tenant isolation covered
  - [x] Shallow Scale controller removed
  - [x] Scale Data routes and external ingestion use typed Kysely operations
  - [x] External scale mail behavior moved to a transport adapter
  - [x] Scale Data tenant isolation and nested response covered
  - [x] Shallow Scale Data controller removed
  - [ ] Remove Scale models after Company, Calendar, and cron callers migrate
- [ ] Queen
- [ ] Rearing Detail
- [ ] Rearing Type
- [ ] Rearing Step
- [ ] Rearing

## Phase 5: identity and workspace slices

- [ ] Auth
- [ ] User
- [ ] Company User
- [ ] Federated credentials
- [ ] Login attempts and refresh tokens
- [ ] Payments and promos
- [ ] Company

## Phase 6: cross-cutting implementation

- [ ] `calendar.util.ts`
- [ ] `autofill.util.ts`
- [ ] `premium.util.ts`
- [ ] `login.util.ts`
- [ ] `auth.util.ts`
- [ ] `delete.util.ts`
- [ ] `cron.util.ts`
- [ ] Company import/export helpers

## Phase 7: removal

- [ ] Zero Objection imports
- [ ] Zero Objection model query calls
- [ ] Delete `src/api/models/`
- [ ] Remove `DatabaseServer` from runtime startup/shutdown
- [ ] Remove `objection` dependency
- [ ] Keep Knex only for migrations
- [ ] Update package description and documentation
- [ ] Regenerate OpenAPI declarations
- [ ] Improve Vue Playwright E2E coverage for migrated wire shapes, tenant boundaries, filters, nested relations, and regression-prone workflows
- [ ] Run server lint, build, and E2E
- [ ] Run Vue lint, typecheck, and improved Playwright E2E suite
- [ ] Deploy beta and monitor SQL/error logs

## Slice definition of done

- [ ] No Objection imports or model calls in migrated slice
- [ ] Kysely queries compile without `any`
- [ ] Ownership and company scoping covered by negative tests
- [ ] Transaction contains complete business operation
- [ ] UTC timestamp behavior preserved
- [ ] Response schema and nested relation shape preserved
- [ ] HTTP and WizBee/internal adapters share operations where applicable
- [ ] Relevant Objection model deleted when no callers remain
- [ ] Server and relevant Vue tests pass
