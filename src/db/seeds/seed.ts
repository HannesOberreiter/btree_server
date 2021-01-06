//const companyData = require('data/company');

exports.seed = function(knex) {
  const fs = require('fs');
  
  const tables = ['companies', 'bees'];
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
