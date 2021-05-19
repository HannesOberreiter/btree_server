# REST API for b.tree Beekeeping Webapplication

Typescript, based on nodejs, express and knex.js, objections.js and datatables.net.

## Docker

For ease of development and deploying into production, a Dockerfile and docker-compose file can be used.

<https://docs.docker.com/compose/>
### Dev

```bash
# Build Local Docker Image
docker compose -f docker-compose-dev.yml build
# Run Container
docker compose -f docker-compose-dev.yml up
# Stop Container 
docker compose -f docker-compose-dev.yml down
# Access Container Bash for npm run commands
docker exec -it btree_api bash
```

## Local

### Dev - Typescript and Watch

Typescript and Nodemon needs to be installed globally.

```bash
npm i -g nodemon
npm i -g typescript
```

- Create Directories
- Compile and Watch Typescript
- Start nodemon
- Run knex commands (migrate, seed etc.)

```bash
npm run create:directories 
npm run dev:tsc 
npm run dev:node
npm run dev:knex <options>
```

### MySQL

 On Mac best to install it with Homebrew, you can use the latest or specify the version with `@5.7`.

```bash
brew install mysql
mysql.server start
mysql.server stop
```

Common problems when authentication fails on local machine:

- <https://stackoverflow.com/questions/1559955/host-xxx-xx-xxx-xxx-is-not-allowed-to-connect-to-this-mysql-server>
- <https://stackoverflow.com/questions/50093144/mysql-8-0-client-does-not-support-authentication-protocol-requested-by-server>


## Datatables

The REST API relies on [datatables.net](https://editor.datatables.net/) and you will need a licence for it, if you host it for yourself.

## Library Version Control

Project uses `npm` as management tool for libraries version control, look file is available in the repository.

## Database Migration

We use knex CLI, <http://knexjs.org/#Migrations-API>.

```bash
npm run dev:knex <options>
```
## Thanks to

The folder structure is based on <https://github.com/konfer-be/ts-express-typeorm-boilerplate>.
