# Backend API for b.tree Beekeeping Webapplication

Written in typescript build with nodejs, express, knex.js and objections.js.

## Docker

For ease of deploying into production, you can use Docker: <https://docs.docker.com/compose/>

### Building image

Currently images are build locally and pushed to DockerHub. This process can be automated to build the newest Docker image when GitHub Master Branch updates.

```bash
# Build image
docker build -t hannesoberreiter/btree_server .
# Push image
docker push hannesoberreiter/btree_server:latest
```

### Running container

```bash
# Run container (server)
docker-compose -f docker-compose.server.yml up
# Stop container  (server)
docker-compose -f docker-compose-server.yml down
# Access Container Bash for npm run commands
docker exec -it btree-server /bin/sh
# Clean Container
docker-compose -f docker-compose-*.yml rm
```

## Development

Nodemon needs to be installed globally.

```bash
npm i -g nodemon
```

- Create Directories
- Compile and Watch Typescript
- Start nodemon
- Run knex commands (migrate, seed etc.)

```bash
npm run dev:build 
npm run dev:serve
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

## Server ngnix

Proxy redirecting inside `upstream.conf`. Important the redirect IP address is not localhost it is the container IP address: `docker inspect <container-id>` (get the gateway IP address + Port). Demo files for ngnix are in the root folder of this repository.

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

## Thanks to

The folder structure is based on <https://github.com/konfer-be/ts-express-typeorm-boilerplate>.
