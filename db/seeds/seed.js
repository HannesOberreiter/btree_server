require('module-alias/register');
const env = require('../../dist/config/environment.config');
const fs = require('fs');
var map = require('lodash/map');
var filter = require('lodash/filter');
var omit = require('lodash/omit');
var find = require('lodash/find');
var cloneDeep = require('lodash/cloneDeep');
var compact = require('lodash/compact');

class findUser {
  constructor() {
    this.movedates = readMigrationTable('movedate.json');
    this.apiaries = readMigrationTable('apiary.json');
    this.count = 0;
  }
  getUserID(hive_id) {
    const movedate = find(this.movedates.data, { hive_id: hive_id });
    if (!movedate) return null;
    const apiary = find(this.apiaries.data, { apiary_id: movedate.apiary_id });
    if (!apiary) {
      this.count++;
      return null;
    }
    //console.log(apiary);
    return apiary.user_id;
  }
}

if (env.env === 'production') {
  console.log('No seeding allowed in production environment!');
  exports.seed = function (_knex) {
    return false;
  };
} else if (env.env === 'staging') {
  // This code is only used for migrating old database to new schema

  const userId = new findUser();

  exports.seed = async function (knex) {
    const promises = [];

    let rawData = '';
    let newData = '';

    /**
      Apiaries
    */
    rawData = readMigrationTable('apiary.json');
    newData = map(rawData.data, (data) => {
      return {
        id: data.apiary_id,
        description: data.adress + ' ' + data.zip + ' ' + data.city,
        latitude: data.latitude ? data.latitude : 0,
        longitude: data.longitude ? data.longitude : 0,
        ...omitFields(data, [
          'apiary_id',
          'adress',
          'zip',
          'city',
          'latitude',
          'longitude',
        ]),
        ...dateFields(data),
      };
    });
    await transactionMigration('apiaries', newData, knex);

    /**
      Bees
    */
    rawData = readMigrationTable('bee.json');
    newData = map(rawData.data, (data) => {
      return {
        id: data.bee_id,
        created_at:
          data.creation_date === '0000-00-00 00:00:00'
            ? null
            : data.creation_date,
        ...omitFields(data, [
          'bee_id',
          'rank',
          'task',
          'firstname',
          'lastname',
          'task_year',
          'creation_date',
        ]),
      };
    });
    await transactionMigration('bees', newData, knex);

    /**
      charges
    */
    rawData = readMigrationTable('charge_control.json');
    newData = map(rawData.data, (data) => {
      return {
        id: data.cc_id,
        name: data.bez,
        type_id: data.ct_id,
        ...dateFields(data),
        ...omitFields(data, ['cc_id', 'bez', 'ct_id', 'unit']),
      };
    });
    await transactionMigration('charges', newData, knex);
    rawData = readMigrationTable('charge_type.json');
    newData = map(rawData.data, (data) => {
      return {
        name: data.type,
        ...omitFields(data, ['type']),
      };
    });
    await transactionMigration('charge_types', newData, knex);

    /**
      checkups
    */
    rawData = readMigrationTable('checkup.json');
    newData = map(rawData.data, (data) => {
      const user_id = userId.getUserID(data.hive_id);
      if (!user_id) return null;
      return {
        user_id: user_id,
        id: data.check_id,
        type_id: data.ct_id,
        varroa: isNaN(data.varroa) ? 0 : Number(data.varroa),
        ...dateFields(data),
        ...omitFields(data, ['check_id', 'ct_id', 'varroa']),
      };
    });
    await transactionMigration('checkups', compact(newData), knex);
    rawData = readMigrationTable('checkup_type.json');
    newData = map(rawData.data, (data) => {
      return {
        id: data.ct_id,
        name: data.type,
        ...omitFields(data, ['type', 'ct_id']),
      };
    });
    await transactionMigration('checkup_types', newData, knex);

    /**
      companies
    */
    rawData = readMigrationTable('members.json');
    newData = map(rawData.data, (data) => {
      return {
        id: data.user_id,
        name: data.username,
        created_at:
          data.creation_date === '0000-00-00 00:00:00'
            ? null
            : data.creation_date,
        ...omitFields(data, [
          'user_id',
          'username',
          'companynumber',
          'dropbox_auth',
          'creation_date',
        ]),
      };
    });
    await transactionMigration('companies', newData, knex);

    /**
      company_bee
    */
    rawData = readMigrationTable('members_bee.json');
    newData = map(rawData.data, (data) => {
      return {
        rank: data.rank > 2 ? 3 : data.rank,
        ...omitFields(data, ['rank']),
      };
    });
    await transactionMigration('company_bee', newData, knex);

    /**
      feeds
    */
    rawData = readMigrationTable('feed.json');
    newData = map(rawData.data, (data) => {
      const user_id = userId.getUserID(data.hive_id);
      if (!user_id) return null;
      return {
        user_id: user_id,
        id: data.feed_id,
        type_id: data.ft_id,
        ...dateFields(data),
        ...omitFields(data, ['feed_id', 'ft_id']),
      };
    });
    await transactionMigration('feeds', compact(newData), knex);
    rawData = readMigrationTable('feed_type.json');
    newData = map(rawData.data, (data) => {
      return {
        id: data.ft_id,
        name: data.type,
        ...omitFields(data, ['type', 'ft_id']),
      };
    });
    await transactionMigration('feed_types', newData, knex);

    /**
      harvests
    */
    rawData = readMigrationTable('harvest.json');
    newData = map(rawData.data, (data) => {
      const user_id = userId.getUserID(data.hive_id);
      if (!user_id) return null;
      return {
        user_id: user_id,
        id: data.harvest_id,
        type_id: data.hs_id,
        amount: data.weight,
        ...dateFields(data),
        ...omitFields(data, ['harvest_id', 'hs_id', 'weight']),
      };
    });
    await transactionMigration('harvests', compact(newData), knex);

    rawData = readMigrationTable('harvest_source.json');
    newData = map(rawData.data, (data) => {
      return {
        id: data.hs_id,
        name: data.source,
        ...omitFields(data, ['source', 'hs_id']),
      };
    });
    await transactionMigration('harvest_types', newData, knex);

    /**
      hives
    */
    rawData = readMigrationTable('hive.json');
    newData = map(rawData.data, (data) => {
      const user_id = userId.getUserID(data.hive_id);
      if (!user_id) return null;
      return {
        id: data.hive_id,
        user_id: user_id,
        ...dateFields(data),
        ...omitFields(data, ['hive_id']),
      };
    });
    await transactionMigration('hives', compact(newData), knex);

    // hive_group is not anymore, need to get amount and save into grouphive field
    rawData = readMigrationTable('hive_group.json');
    newData = filter(rawData.data, (d) => d.amount !== '0');
    await transactionMigration('hive_group', newData, knex);

    rawData = readMigrationTable('source.json');
    newData = map(rawData.data, (data) => {
      return {
        id: data.source_id,
        name: data.source,
        ...omitFields(data, ['source', 'source_id']),
      };
    });
    await transactionMigration('hive_sources', newData, knex);

    rawData = readMigrationTable('type.json');
    newData = map(rawData.data, (data) => {
      return {
        id: data.type_id,
        name: data.type,
        ...omitFields(data, ['type', 'type_id']),
      };
    });
    await transactionMigration('hive_types', newData, knex);

    /**
      movedates
    */
    rawData = readMigrationTable('movedate.json');
    newData = map(rawData.data, (data) => {
      return {
        ...dateFields(data, (deleted = false)),
        ...omitFields(data),
      };
    });
    await transactionMigration('movedates', newData, knex);

    /**
      queens
    */
    rawData = readMigrationTable('queen.json');
    newData = map(rawData.data, (data) => {
      return {
        id: data.queen_id,
        name: data.beebreed_nr,
        ...dateFields(data),
        ...omitFields(data, ['queen_id', 'beebreed_nr']),
      };
    });
    await transactionMigration('queens', newData, knex);

    rawData = readMigrationTable('race.json');
    newData = map(rawData.data, (data) => {
      return {
        id: data.race_id,
        name: data.race,
        ...omitFields(data, ['race', 'race_id']),
      };
    });
    await transactionMigration('queen_races', newData, knex);

    rawData = readMigrationTable('mating.json');
    newData = map(rawData.data, (data) => {
      return {
        id: data.mating_id,
        name: data.mating_place,
        ...omitFields(data, ['mating_place', 'mating_id']),
      };
    });
    await transactionMigration('queen_matings', newData, knex);

    /**
      rearing
    */
    rawData = readMigrationTable('rear_detail.json');
    newData = map(rawData.data, (data) => {
      return {
        ...omitFields(data, []),
      };
    });
    await transactionMigration('rearing_details', newData, knex);

    rawData = readMigrationTable('rear_type.json');
    newData = map(rawData.data, (data) => {
      return {
        ...omitFields(data, []),
      };
    });
    await transactionMigration('rearing_types', newData, knex);

    rawData = readMigrationTable('rear_mn.json');
    newData = map(rawData.data, (data) => {
      return {
        ...omitFields(data, []),
      };
    });
    await transactionMigration('rearing_steps', newData, knex);

    rawData = readMigrationTable('rear.json');
    newData = map(rawData.data, (data) => {
      return {
        ...omitFields(data, []),
      };
    });
    await transactionMigration('rearings', newData, knex);

    /**
      todos
    */
    rawData = readMigrationTable('customEvent.json');
    newData = map(rawData.data, (data) => {
      return {
        ...dateFields(data, (deleted = false)),
        ...omitFields(data, []),
      };
    });
    await transactionMigration('todos', newData, knex);

    /**
      treatments
    */
    rawData = readMigrationTable('treatment.json');
    newData = map(rawData.data, (data) => {
      const user_id = userId.getUserID(data.hive_id);
      if (!user_id) return null;
      return {
        user_id: user_id,
        id: data.treatment_id,
        type_id: data.tt_type,
        ...dateFields(data),
        ...omitFields(data, ['treatment_id', 'tt_type']),
      };
    });
    await transactionMigration('treatments', compact(newData), knex);

    rawData = readMigrationTable('treatment_type.json');
    newData = map(rawData.data, (data) => {
      return {
        id: data.tt_type,
        name: data.type,
        ...omitFields(data, ['type', 'tt_type']),
      };
    });
    await transactionMigration('treatment_types', newData, knex);

    rawData = readMigrationTable('disease.json');
    newData = map(rawData.data, (data) => {
      return {
        id: data.disease_id,
        name: data.type,
        ...omitFields(data, ['type', 'disease_id']),
      };
    });
    await transactionMigration('treatment_diseases', newData, knex);

    rawData = readMigrationTable('vet.json');
    newData = map(rawData.data, (data) => {
      return {
        id: data.vet_id,
        name: data.vet,
        ...omitFields(data, ['vet', 'vet_id']),
      };
    });
    await transactionMigration('treatment_vets', newData, knex);

    /**
      scales
    */
    rawData = readMigrationTable('scale.json');
    newData = map(rawData.data, (data) => {
      return {
        name: data.ident,
        ...omitFields(data, ['ident']),
      };
    });
    await transactionMigration('scales', newData, knex);

    rawData = readMigrationTable('scale_data.json');
    newData = map(rawData.data, (data) => {
      return {
        datetime: data.date,
        ...omitFields(data, ['date']),
      };
    });
    await transactionMigration('scale_data', newData, knex);

    return Promise.all(promises);
  };
} else {
  exports.seed = async function (knex) {
    let tables = [];
    fs.readdirSync(__dirname + `/data/`).forEach((file) => {
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
        fs.readFileSync(__dirname + `/data/${table}.json`, 'utf-8')
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
}

function readMigrationTable(table) {
  const liveFolder =
    '/migration/btree_at_app_4dkg52.json/btree_at_app_4dkg52_table_';
  let file = fs.readFileSync(__dirname + liveFolder + table, 'utf-8');
  return JSON.parse(file.replace(/^,/, ''));
}

function dateFields(data, deleted = true) {
  if (deleted) {
    return {
      created_at: data.created === '0000-00-00 00:00:00' ? null : data.created,
      updated_at: data.edited === '0000-00-00 00:00:00' ? null : data.edited,
      deleted_at:
        data.deleted_date === '0000-00-00 00:00:00' ? null : data.deleted_date,
    };
  } else {
    return {
      created_at: data.created === '0000-00-00 00:00:00' ? null : data.created,
      updated_at: data.edited === '0000-00-00 00:00:00' ? null : data.edited,
    };
  }
}

function omitFields(data, fields = []) {
  const standard_omit = ['created', 'edited', 'deleted_date', 'html_note'];
  return omit(data, standard_omit.concat(fields));
}

async function transactionMigration(table, data, knex) {
  console.log(`Insert ${table}: ${data.length} rows`);
  return knex
    .transaction(async function (trx) {
      await knex.raw('SET FOREIGN_KEY_CHECKS=0').transacting(trx);
      await knex.raw('SET sql_mode=""').transacting(trx);
      if (table === 'hive_group') {
        map(data, async (d) => {
          await knex('hives')
            .transacting(trx)
            .update('grouphive', d.amount)
            .where('id', d.hive_id)
            .catch(function (error) {
              console.log(error);
            });
        });
      } else {
        await knex(table).transacting(trx).del();
        await knex(table).transacting(trx).truncate();
        await knex
          .batchInsert(table, data, 10000)
          .transacting(trx)
          .catch(function (error) {
            console.log(error);
          });
      }
      await knex.raw('SET FOREIGN_KEY_CHECKS=1').transacting(trx);
    })
    .catch(function (error) {
      console.log(error);
    });
}
