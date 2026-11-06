# b.tree Beekeeping Webapplication

[![server-test](https://github.com/HannesOberreiter/btree/actions/workflows/server-test.yml/badge.svg)](https://github.com/HannesOberreiter/btree/actions/workflows/server-test.yml)
[![release-please](https://github.com/HannesOberreiter/btree/actions/workflows/release-please.yml/badge.svg)](https://github.com/HannesOberreiter/btree/actions/workflows/release-please.yml)

The b.tree application is for managing your honey bee colonies in a modern way. More infos at <https://www.btree.at>.

This repository contains the b.tree server and the b.tree web app:

- [`apps/server`](apps/server) - Backend API, written in TypeScript with Node.js, Fastify, Kysely, and Knex migration tooling.
  - Live: <https://api.btree.at>
  - Beta: <https://api-beta.btree.at>
  - Docker image: [`hannesoberreiter/btree_server`](https://hub.docker.com/r/hannesoberreiter/btree_server)
- [`apps/web`](apps/web) - Frontend, written in TypeScript with Vue 3 and Quasar.
  - Live: <https://app.btree.at>
  - Beta: <https://beta.btree.at>

Related repositories:

- [b.tree Database Infrastructure](https://github.com/HannesOberreiter/btree_database)
- [b.tree Documentation](https://github.com/HannesOberreiter/btree_sites)
- [b.tree iOS](https://github.com/HannesOberreiter/btree_ios)

## License

[GNU Affero General Public License v3.0](LICENSE)
