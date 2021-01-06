# REST API for b.tree Beekeeping Webapplication

Based on nodejs, express and knex.js and objections.js.

## Dev - Typescript and Watch

Typescript and Nodemon needs to be installed globally.

```bash
npm i -g nodemon
npm i -g typescript
```

Then you can compile and watch.

```bash
// Typescript Compile and Watch for Changes
tsc -watch
// Node, Watch Dist Folder
npm run dev
```

## Datatables

The REST API relies on [datatables.net](https://editor.datatables.net/) and you will need a licence for it, if you host it for yourself.

## Library Version Control

Project uses `npm` as management tool for libraries version control, look file is available in the repository.

## Database Migration

We use knex CLI, <http://knexjs.org/#Migrations-API>.

As we use TS and different folder structure the knex command is defined in the package.json

```bash
 npm run dev-knex <options>
```

## MySQL

 On Mac best to install it with Homebrew, you can use the latest or specify the version with `@5.7`.

```bash
brew install mysql
mysql.server start
mysql.server stop
```

Common problems when authentication fails on local machine:

- <https://stackoverflow.com/questions/1559955/host-xxx-xx-xxx-xxx-is-not-allowed-to-connect-to-this-mysql-server>
- <https://stackoverflow.com/questions/50093144/mysql-8-0-client-does-not-support-authentication-protocol-requested-by-server>
