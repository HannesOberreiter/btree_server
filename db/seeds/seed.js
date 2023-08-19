import fs from 'fs';
import { map, omit, cloneDeep } from 'lodash-es';
import * as env from '../../dist/config/environment.config.js';

const dirname = new URL('./', import.meta.url).pathname;

export const seed = async function (knex) {
  if (env.env === 'production') {
    console.log('No seeding allowed in production environment!');
    return false;
  }
  let tables = [];
  fs.readdirSync(dirname + `/data/`).forEach((file) => {
    file = file.replace('.json', '');
    tables.push(file);
  });

  const promises = [];

  // First we clear all tables with truncate
  // then fill from data jsons
  // FOREIGN KEY CHECK removed to prevent errors
  for (let t = 0; t < tables.length; t++) {
    const table = tables[t];
    const jsonData = JSON.parse(
      fs.readFileSync(dirname + `/data/${table}.json`, 'utf-8'),
    );
    let duplicates = 1;
    if (['checkups', 'feeds', 'treatments', 'queens'].includes(table)) {
      duplicates = env.env === 'test' || env.env === 'ci' ? 1 : 20;
    }
    let newData = cloneDeep(jsonData);

    if (table === 'checkups') {
      newData = map(newData, (d) => {
        return {
          varroa: isNaN(d.varroa) ? 0 : Number(d.varroa),
          ...omit(d, 'varroa'),
        };
      });
    }

    for (let i = 1; i <= duplicates; i++) {
      if (i > 1) {
        newData = map(cloneDeep(newData), (d) => omit(d, ['id']));
      }
      await transactionMigration(table, newData, knex);

      /*promises.push(
          knex.transaction(function (trx) {
            knex
              .raw('SET FOREIGN_KEY_CHECKS=0')
              .transacting(trx)
              .then(async function () {
                return await knex(table).transacting(trx).truncate();
              })
              .then(async function () {
                return await knex(table)
                  .transacting(trx)
                  .insert(cloneDeep(newData));
              })
              .finally(trx.commit);
          })
        );*/
    }
  }
  return Promise.all(promises);
};

async function transactionMigration(table, data, knex) {
  console.log(`Insert ${table}: ${data.length} rows`);
  return knex
    .transaction(async function (trx) {
      await knex.raw('SET FOREIGN_KEY_CHECKS=0').transacting(trx);
      await knex.raw('SET sql_mode=""').transacting(trx);
      await knex(table).transacting(trx).del();
      await knex(table).transacting(trx).truncate();
      await knex
        .batchInsert(table, data, 10000)
        .transacting(trx)
        .catch(function (error) {
          console.error(error);
        });
      await knex.raw('SET FOREIGN_KEY_CHECKS=1').transacting(trx);
    })
    .catch(function (error) {
      console.error(error);
    });
}
