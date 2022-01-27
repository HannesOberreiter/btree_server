require('module-alias/register');
const env = require("../../dist/config/environment.config");
const fs = require('fs');

if(env === "production"){
  console.log("No seeding allowed in production environment!")
  exports.seed = function(_knex) {
    return false;
  }
} else {
  exports.seed = function(knex) {
    
    let tables = [];
    fs.readdirSync(__dirname+`/data/`).forEach(file => {
      file = file.replace(".json", "");
      tables.push(file)
    });

    const promises = [];

    // First we clear all tables with truncate
    // then fill from data jsons
    // FOREIGN KEY CHECK removed to prevent errors
    tables.forEach(table => {
      const jsonData = JSON.parse(fs.readFileSync(__dirname+`/data/${table}.json`, 'utf-8'));
      promises.push(
        knex.transaction(function(trx) {
          knex.raw('SET FOREIGN_KEY_CHECKS=0').transacting(trx)
          .then(function() {
            return knex(table).transacting(trx).truncate();
          })
          .then(function() {
            return knex(table).transacting(trx).insert(jsonData);
          })
          .finally(trx.commit);
        })
      );
    });

    return Promise.all(promises);

  };
}
