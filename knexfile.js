/**
Helper file for knex CLI migrate/seed
 */
require('module-alias/register');
const { knexConfig } = require("./dist/config/environment.config");
module.exports = knexConfig
