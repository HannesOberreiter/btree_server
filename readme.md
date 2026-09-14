# Backend API for b.tree Beekeeping Webapplication

[![test](https://github.com/HannesOberreiter/btree_server/actions/workflows/test.yml/badge.svg)](https://github.com/HannesOberreiter/btree_server/actions/workflows/test.yml)
[![docker-push](https://github.com/HannesOberreiter/btree_server/actions/workflows/docker-push.yml/badge.svg)](https://github.com/HannesOberreiter/btree_server/actions/workflows/docker-push.yml)
[![docker-push-beta](https://github.com/HannesOberreiter/btree_server/actions/workflows/docker-push-beta.yml/badge.svg)](https://github.com/HannesOberreiter/btree_server/actions/workflows/docker-push-beta.yml)

Written in TypeScript with Node.js, Fastify, Kysely, and Knex migration tooling.

- [Repo - b.tree Server API](https://github.com/HannesOberreiter/btree_server)
  - Live: <https://api.btree.at>
  - Beta: <https://api-beta.btree.at>
- [Private Repo - b.tree Frontend](https://github.com/HannesOberreiter/btree_vue)
  - Live: <https://app.btree.at>
  - Beta: <https://beta.btree.at>
- [Repo - b.tree Database](https://github.com/HannesOberreiter/btree_database)
- [Repo - b.tree Documentation](https://github.com/HannesOberreiter/btree_sites)
- [Repo - b.tree iOS](https://github.com/HannesOberreiter/btree_ios)

## Docker Container

### Building image

Work on `beta` and promote changes to `main` through pull requests from `beta`, except for the existing automated release-please PRs. Do not commit directly or merge locally into `main`.

The beta image is published on pushes to `beta`. Pushes to `main` run release-please; when a release is created, it calls the production image workflow. The image workflows also support manual dispatch. Images are pushed to a private DockerHub repository. To build an image locally:

```bash
# Build image
docker build -t hannesoberreiter/btree_server .
# Push image
docker push hannesoberreiter/btree_server:latest
```

### Running container

Hint: To be able to pull from a DockerHub private repo create a api key with read-only access and login once to docker on your server eg. `docker login -u hannesoberreiter` with the api token as password. The token will be saved in your config and you can call `docker compose` on the private repo.

```bash
# Live API examples; use docker-compose.api-beta.yml for beta.
# Preserve the existing deployment's Compose project name.
# Pull latest and run
docker compose -f docker-compose.api.yml pull
docker compose -f docker-compose.api.yml up -d
# Stop container
docker compose -f docker-compose.api.yml down
# Access the container shell for pnpm commands
docker exec -it btree-server /bin/sh
# Remove stopped service containers
docker compose -f docker-compose.api.yml rm
```

### Docker Compose Files

In the root directory you can find example composer files which are used on our server for live and beta (testing and staging) backend servers.

- [docker-compose.api.yml](docker-compose.api.yml)
  - Live: <https://api.btree.at>
- [docker-compose.api-beta.yml](docker-compose.api-beta.yml)
  - Live: <https://api-beta.btree.at>

Best practices for node container see: <https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md>

### Deployment

The beta api automatically pulls with a Cron-Job the latest version von DockerHub each day, read the readme on [Repo - b.tree Database](https://github.com/HannesOberreiter/btree_database) for more information.

The live api server needs to be upgraded manually which can be archived by `docker compose pull  && docker compose up -d`.

## Development

Use Node 22 and the pnpm version pinned in `package.json`. Configure `env/development.env` and `env/test.env` using `env/example.env`, and provide MariaDB and Redis before running the server or E2E tests.

Knex, development serving, and E2E use compiled files from `dist`, so build first:

```bash
pnpm install
pnpm run build
# Development database only: migrations and seeds modify existing data.
pnpm run dev:init
```

Use disposable databases for development seeding and E2E. The E2E global setup runs migrations, truncates non-CI tables, and starts the compiled server itself; there is no separate `test:init` command. Do not start another backend on the test server's port.

```bash
pnpm run test:e2e
```

For development, run `pnpm run dev:build` and `pnpm run dev:serve` in separate terminals. Run `pnpm run lint` separately; CI runs build and E2E, but not lint. Use `pnpm run lint:fix` only when you intend to apply formatting and lint fixes.

## Database: MariaDB

We use Docker with MariaDB and a shared network to connect the API and database containers. Infrastructure definitions live in [HannesOberreiter/btree_database](https://github.com/HannesOberreiter/btree_database); application migrations and seeds remain in this repository.

### Local Installation

Prefer the MariaDB containers from `HannesOberreiter/btree_database` for consistency with the application's database setup. The following generic MySQL installation example does not establish compatibility with arbitrary MySQL versions; validate compatibility before using MySQL instead of MariaDB.

```bash
brew install mysql
mysql.server start
mysql.server stop
```

Common problems when authentication fails on local machine:

- <https://stackoverflow.com/questions/1559955/host-xxx-xx-xxx-xxx-is-not-allowed-to-connect-to-this-mysql-server>
- <https://stackoverflow.com/questions/50093144/mysql-8-0-client-does-not-support-authentication-protocol-requested-by-server>

## Library Version Control

Project uses `pnpm` as management tool for library version control. Lock file is available in the repository.

## Database Migration

Use the Knex CLI for migrations, seeds, and test setup; application queries use Kysely. See <http://knexjs.org/#Migrations-API>. Build `dist` before invoking Knex:

```bash
pnpm run build
pnpm run dev:knex <options> # e.g. migrate:latest
```

After schema changes, regenerate `src/types/db.types.ts` with `pnpm run db:types` against the intended migrated database. The wrapper defaults to `env/development.env` and normalizes tinyint and Decimal types; do not replace it with bare codegen.

## Server Ngnix

Proxy redirecting inside `upstream.conf`. Important the redirect IP address is not localhost it is the container IP address: `docker inspect <container-id>` (get the gateway IP address + Port). Demo files for Ngnix are in the root folder of this repository, which are also used on our live server.

```bash
# path: /etc/nginx/conf.d/upstream.conf
upstream btree_at_api {
    server 172.18.0.1:1338; # Gateway + Port
}
```

```bash
# Create Config File inside /etc/nginx/sites-available
touch your_url.conf
# Create Symlink in /etc/nginx/sites-enabled
ln -s ../sites-available/your_url.conf .
```

### SSL Certificates

Using certbot: <https://certbot.eff.org/instructions?ws=nginx&os=ubuntufocal>

```bash
sudo certbot --nginx
```
