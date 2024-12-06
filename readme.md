# Backend API for b.tree Beekeeping Webapplication

[![test](https://github.com/HannesOberreiter/btree_server/actions/workflows/test.yml/badge.svg)](https://github.com/HannesOberreiter/btree_server/actions/workflows/test.yml)
[![docker-push](https://github.com/HannesOberreiter/btree_server/actions/workflows/docker-push.yml/badge.svg)](https://github.com/HannesOberreiter/btree_server/actions/workflows/docker-push.yml)
[![docker-push-beta](https://github.com/HannesOberreiter/btree_server/actions/workflows/docker-push-beta.yml/badge.svg)](https://github.com/HannesOberreiter/btree_server/actions/workflows/docker-push-beta.yml)

Written in typescript build with nodejs, fastify, knex.js and objections.js.

- [Repo - b.tree Server API](https://github.com/HannesOberreiter/btree_server)
  - Live: <https://api.btree.at>
  - Beta: <https://api-beta.btree.at>
- [Private Repo - b.tree Frontend](https://github.com/HannesOberreiter/btree_vue)
  - Live: <https://app.btree.at>
  - Beta: <https://beta.btree.at>
- [Repo - b.tree Database](https://github.com/HannesOberreiter/btree_database)
- [Repo - b.tree iOS](https://github.com/HannesOberreiter/btree_ios)

## Docker Container

### Building image

Currently images are build automatically on 'main' branch merge with GitHub actions and pushed to a private DockerHub repo. If you want to build the image locally use following commands:

```bash
# Build image
docker build -t hannesoberreiter/btree_server .
# Push image
docker push hannesoberreiter/btree_server:latest
```

### Running container

Hint: To be able to pull from a DockerHub private repo create a api key with read-only access and login once to docker on your server eg. `docker login -u hannesoberreiter` with the api token as password. The token will be saved in your config and you can call `docker compose` on the private repo.

```bash
# Pull latest and run
docker compose pull  && docker compose up -d
# Run container (server) (define file if not the only one in folder)
docker compose -f docker-compose.server.yml up -d
# Stop container  (server)
docker compose -f docker-compose-server.yml down
# Access Container Bash for npm run commands
docker exec -it btree-server /bin/sh
# Clean Container
docker compose -f docker-compose-*.yml rm
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

First migrate and seed your database with knex commands, beforehand make sure that your development and testing database is up and running.

```bash
npm run dev:init
npm run test:init
```

Next build the html mails with `mjml`

```bash
npm run mail
```

## Database: MariaDB

We use Docker with MariaDB and network to connect multiple docker instances, see GitHub Repo: <https://github.com/HannesOberreiter/btree-docker-mysql>

### Local Installation

Alternative you can also install MySQL on your computer and run it locally. On Mac best to install it with Homebrew, you can use the latest or specify the version with `@5.7`.

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
