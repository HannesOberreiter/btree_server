# Backend API for b.tree Beekeeping Webapplication

Written in typescript build with nodejs, express, knex.js and objections.js.

## Docker

For ease of development and deploying into production, you can use Docker: <https://docs.docker.com/compose/>

```bash
# Build Local Docker Image
docker-compose -f docker-compose.dev.yml build
# Run Container
docker-compose -f docker-compose.dev.yml up
# Stop Container 
docker-compose -f docker-compose-dev.yml down
# Start Container
docker-compose -f docker-compose-dev.yml start
docker-compose -f docker-compose-dev.yml attach

# Access Container Bash for npm run commands
docker exec -it btree_api /bin/sh
# Start TypeScript Dev
docker exec -it btree_api npm run dev:tsc
```

### Production

Needs already prebuild dist and mails folder to run correctly.

```bash
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
docker exec -it btree_api_production /bin/sh
# Generate Local Image
docker save btree_server_btree_api_production | gzip > btree_server_btree_api_production.tar.gz
# Load Image on Server
docker load < btree_server_btree_api_production.tar.gz
```

### Clear Container

```bash
docker-compose -f docker-compose-*.yml rm
```

## Local w/o Docker

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

## MySQL

I use Docker with MySQL and network to connect multiple docker instances, see GitHub Repo: <https://github.com/HannesOberreiter/btree-docker-mysql>

You can also install MySQL on your computer and run it locally. On Mac best to install it with Homebrew, you can use the latest or specify the version with `@5.7`.

```bash
brew install mysql
mysql.server start
mysql.server stop
```

Common problems when authentication fails on local machine:

- <https://stackoverflow.com/questions/1559955/host-xxx-xx-xxx-xxx-is-not-allowed-to-connect-to-this-mysql-server>
- <https://stackoverflow.com/questions/50093144/mysql-8-0-client-does-not-support-authentication-protocol-requested-by-server>

## Library Version Control

Project uses `npm` as management tool for libraries version control, look file is available in the repository.

## Database Migration

We use knex CLI, <http://knexjs.org/#Migrations-API>.

```bash
npm run dev:knex <options> # eg. migrate:latest
```

## Thanks to

The folder structure is based on <https://github.com/konfer-be/ts-express-typeorm-boilerplate>.
