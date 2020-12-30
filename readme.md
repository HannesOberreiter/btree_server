# REST API for b.tree Beekeeping Webapplication

Based on nodejs, express and knex.js and objections.js.

## Library Version Control

Project uses `yarn` as management tool for libraries version control, look file is available in the repository.

## Database Migration

We use knex CLI, you can also use the `npx knex XXX`, <http://knexjs.org/#Migrations-API>.

```bash
 yarn knex migrate:latest
 yarn knex migrate:rollback
```

## MySQL

 On Mac best to install it with Homebrew, you can use the latest or specify the version with `@5.7`.

```bash
brew install mysql
mysql.server start
mysql.server stop
```