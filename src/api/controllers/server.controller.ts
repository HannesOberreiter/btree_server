import { FastifyReply, FastifyRequest } from 'fastify';
import Knex from 'knex';
import { externalKnexConfig } from '../../config/environment.config.js';
import { Logger } from '../../services/logger.service.js';
import httpErrors from 'http-errors';
import { Apiary } from '../models/apiary.model.js';
import { HiveType } from '../models/option/hive_type.mode.js';
import { HiveSource } from '../models/option/hive_source.model.js';
import { Hive } from '../models/hive.model.js';
import { Movedate } from '../models/movedate.model.js';
import { Queen } from '../models/queen.model.js';
import { QueenRace } from '../models/option/queen_race.model.js';
import { QueenMating } from '../models/option/queen_mating.model.js';
import { CheckupType } from '../models/option/checkup_type.model.js';
import { Checkup } from '../models/checkup.model.js';
import { FeedType } from '../models/option/feed_type.model.js';
import { Feed } from '../models/feed.model.js';
import { HarvestType } from '../models/option/harvest_type.model.js';
import { Harvest } from '../models/harvest.model.js';
import { TreatmentType } from '../models/option/treatment_type.model.js';
import { TreatmentDisease } from '../models/option/treatment_disease.model.js';
import { TreatmentVet } from '../models/option/treatment_vet.model.js';
import { Treatment } from '../models/treatment.model.js';
import { Todo } from '../models/todo.model.js';
import { ChargeType } from '../models/option/charge_type.model.js';
import { Charge } from '../models/charge.model.js';

const externalKnex = Knex.knex(externalKnexConfig);

export default class ServerController {
  /**
   * @description move data from one server to another, using api key on external server. Apiaries and hives must be empty. Currently not imported is the mother_id of queens (own mother), rearings, user and scales data.
   */
  static async switch(req: FastifyRequest, reply: FastifyReply) {
    if (!externalKnex) {
      throw httpErrors.InternalServerError(
        'Could not connect to external server',
      );
    }
    const { key } = req.body as any;
    if (!key) {
      throw httpErrors.BadRequest('Missing parameters');
    }

    /* Check if api key exists */
    const company = await externalKnex('companies')
      .where({ api_active: true, api_key: key })
      .first();
    if (!company) {
      throw httpErrors.Unauthorized('Company not found');
    }
    const user_id = company.id;

    /* Check if apiaries and hives are empty */
    const apiaries = await externalKnex('apiaries')
      .where({
        user_id: user_id,
      })
      .count('id');
    if (apiaries['id'] > 0) {
      throw httpErrors.Conflict('Apiaries are not empty');
    }
    const hives = await externalKnex('hives')
      .where({
        user_id: user_id,
      })
      .count('id');
    if (hives['id'] > 0) {
      throw httpErrors.Conflict('Hives are not empty');
    }

    const trx = await externalKnex.transaction();
    try {
      const apiaries = await moveApiaries(trx, user_id);
      const hives = await moveHives(trx, user_id);

      const moves = await Movedate.query()
        .joinRelated('hive')
        .where({ user_id });
      moves.map((move) => {
        delete move.id;
        delete move.edit_id;
        delete move.hive;
        move.apiary_id = apiaries[move.apiary_id];
        move.hive_id = hives[move.hive_id];
        return move;
      });
      await trx.insert(moves).into('movedates');

      await moveQueens(trx, user_id, hives);
      await moveCheckups(trx, user_id, hives);
      await moveFeeds(trx, user_id, hives);
      await moveHarvests(trx, user_id, hives);
      await moveTreatments(trx, user_id, hives);

      await moveTodos(trx, user_id);
      await moveCharges(trx, user_id);

      await trx.commit();
    } catch (error) {
      await trx.rollback();
      throw httpErrors.InternalServerError('Could not move data');
    }
  }
}

const oldMap = (insert: Array<{ id: number }>, copy: Array<{ id: number }>) => {
  const oldMap: Record<string, number> = {};
  insert.forEach((item, index) => {
    oldMap[copy[index].id] = item.id;
  });
  return oldMap;
};

async function moveCharges(trx: Knex.Knex.Transaction, user_id: number) {
  const types = await ChargeType.query().where({ user_id });
  const copyTypes = JSON.parse(JSON.stringify(types));
  types.map((type) => {
    delete type.id;
    type.user_id = user_id;
    return type;
  });
  const insertTypes = await trx.insert(types, ['id']).into('charge_types');
  const oldMapTypes = oldMap(insertTypes, copyTypes);

  const charges = await Charge.query().where({ user_id });
  charges.map((charge) => {
    delete charge.id;
    delete charge.edit_id;
    delete charge.bee_id;
    charge.user_id = user_id;
    charge.type_id = oldMapTypes[charge.type_id];
    return charge;
  });
}

async function moveTodos(trx: Knex.Knex.Transaction, user_id: number) {
  const todos = await Todo.query().where({ user_id });
  todos.map((todo) => {
    delete todo.id;
    delete todo.edit_id;
    delete todo.bee_id;
    todo.user_id = user_id;
    return todo;
  });
  await trx.insert(todos).into('todos');
}

async function moveTreatments(
  trx: Knex.Knex.Transaction,
  user_id: number,
  hives: Record<string, number>,
) {
  const types = await TreatmentType.query().where({ user_id });
  const copyTypes = JSON.parse(JSON.stringify(types));
  types.map((type) => {
    delete type.id;
    type.user_id = user_id;
    return type;
  });
  const insertTypes = await trx.insert(types, ['id']).into('treatment_types');
  const oldMapTypes = oldMap(insertTypes, copyTypes);

  const diseases = await TreatmentDisease.query().where({ user_id });
  const copyDiseases = JSON.parse(JSON.stringify(diseases));
  diseases.map((disease) => {
    delete disease.id;
    disease.user_id = user_id;
    return disease;
  });
  const insertDiseases = await trx
    .insert(diseases, ['id'])
    .into('treatment_diseases');
  const oldMapDiseases = oldMap(insertDiseases, copyDiseases);

  const vets = await TreatmentVet.query().where({ user_id });
  const copyVets = JSON.parse(JSON.stringify(vets));
  vets.map((vet) => {
    delete vet.id;
    vet.user_id = user_id;
    return vet;
  });
  const insertVets = await trx.insert(vets, ['id']).into('treatment_vets');
  const oldMapVets = oldMap(insertVets, copyVets);

  const treatments = await Treatment.query().where({ user_id });
  treatments.map((treatment) => {
    delete treatment.id;
    delete treatment.edit_id;
    delete treatment.bee_id;
    treatment.user_id = user_id;
    treatment.hive_id = hives[treatment.hive_id];
    treatment.type_id = oldMapTypes[treatment.type_id];
    treatment.disease_id = oldMapDiseases[treatment.disease_id];
    treatment.vet_id = oldMapVets[treatment.vet_id];
    return treatment;
  });
  await trx.insert(treatments).into('treatments');
}

async function moveHarvests(
  trx: Knex.Knex.Transaction,
  user_id: number,
  hives: Record<string, number>,
) {
  const types = await HarvestType.query().where({ user_id });
  const copyTypes = JSON.parse(JSON.stringify(types));
  types.map((type) => {
    delete type.id;
    type.user_id = user_id;
    return type;
  });
  const insertTypes = await trx.insert(types, ['id']).into('harvest_types');
  const oldMapTypes = oldMap(insertTypes, copyTypes);

  const harvests = await Harvest.query().where({ user_id });
  harvests.map((harvest) => {
    delete harvest.id;
    delete harvest.edit_id;
    delete harvest.bee_id;
    harvest.user_id = user_id;
    harvest.hive_id = hives[harvest.hive_id];
    harvest.type_id = oldMapTypes[harvest.type_id];
    return harvest;
  });
  await trx.insert(harvests).into('harvests');
}

async function moveFeeds(
  trx: Knex.Knex.Transaction,
  user_id: number,
  hives: Record<string, number>,
) {
  const types = await FeedType.query().where({ user_id });
  const copyTypes = JSON.parse(JSON.stringify(types));
  types.map((type) => {
    delete type.id;
    type.user_id = user_id;
    return type;
  });
  const insertTypes = await trx.insert(types, ['id']).into('feed_types');
  const oldMapTypes = oldMap(insertTypes, copyTypes);

  const feeds = await Feed.query().where({ user_id });
  feeds.map((feed) => {
    delete feed.id;
    delete feed.edit_id;
    delete feed.bee_id;
    feed.user_id = user_id;
    feed.hive_id = hives[feed.hive_id];
    feed.type_id = oldMapTypes[feed.type_id];
    return feed;
  });
  await trx.insert(feeds).into('feeds');
}

async function moveCheckups(
  trx: Knex.Knex.Transaction,
  user_id: number,
  hives: Record<string, number>,
) {
  const types = await CheckupType.query().where({ user_id });
  const copyTypes = JSON.parse(JSON.stringify(types));
  types.map((type) => {
    delete type.id;
    type.user_id = user_id;
    return type;
  });
  const insertTypes = await trx.insert(types, ['id']).into('checkup_types');
  const oldMapTypes = oldMap(insertTypes, copyTypes);

  const checkups = await Checkup.query().where({ user_id });
  checkups.map((checkup) => {
    delete checkup.id;
    delete checkup.edit_id;
    delete checkup.bee_id;
    checkup.user_id = user_id;
    checkup.hive_id = hives[checkup.hive_id];
    checkup.type_id = oldMapTypes[checkup.type_id];
    return checkup;
  });
  await trx.insert(checkups).into('checkups');
}

async function moveQueens(
  trx: Knex.Knex.Transaction,
  user_id: number,
  hives: Record<string, number>,
) {
  const races = await QueenRace.query().where({ user_id });
  const copyRaces = JSON.parse(JSON.stringify(races));
  races.map((race) => {
    delete race.id;
    race.user_id = user_id;
    return race;
  });
  const insertRaces = await trx.insert(races, ['id']).into('queen_races');
  const oldMapRaces = oldMap(insertRaces, copyRaces);

  const matings = await QueenMating.query().where({ user_id });
  const copyMatings = JSON.parse(JSON.stringify(matings));
  matings.map((mating) => {
    delete mating.id;
    mating.user_id = user_id;
    return mating;
  });
  const insertMatings = await trx.insert(matings, ['id']).into('queen_matings');
  const oldMapMatings = oldMap(insertMatings, copyMatings);

  const queens = await Queen.query().where({ user_id });
  queens.map((queen) => {
    delete queen.id;
    delete queen.edit_id;
    delete queen.bee_id;
    queen.user_id = user_id;
    queen.hive_id = hives[queen.hive_id];
    queen.race_id = oldMapRaces[queen.race_id];
    queen.mating_id = oldMapMatings[queen.mating_id];
    queen.mother_id = null; /* we drop own mothers for server swap */
    return queen;
  });
  await trx.insert(queens).into('queens');
  return;
}

async function moveHives(trx: Knex.Knex.Transaction, user_id: number) {
  const hiveTypes = await HiveType.query().where({ user_id });
  const copyTypes = JSON.parse(JSON.stringify(hiveTypes));
  hiveTypes.map((hiveType) => {
    delete hiveType.id;
    hiveType.user_id = user_id;
    return hiveType;
  });
  const insertTypes = await trx.insert(hiveTypes, ['id']).into('hive_types');
  const oldMapTypes = oldMap(insertTypes, copyTypes);

  const hiveSource = await HiveSource.query().where({ user_id });
  const copySource = JSON.parse(JSON.stringify(hiveSource));
  hiveSource.map((source) => {
    delete source.id;
    source.user_id = user_id;
    return source;
  });
  const insertSource = await trx
    .insert(hiveSource, ['id'])
    .into('hive_sources');
  const oldMapSource = oldMap(insertSource, copySource);

  const hives = await Hive.query().where({ user_id });
  const copyHives = JSON.parse(JSON.stringify(hives));
  hives.map((hive) => {
    delete hive.id;
    delete hive.edit_id;
    delete hive.bee_id;
    hive.user_id = user_id;
    hive.type_id = oldMapTypes[hive.type_id];
    hive.source_id = oldMapSource[hive.source_id];
    return hive;
  });
  const insertHives = await trx.insert(hives, ['id']).into('hives');
  return oldMap(insertHives, copyHives);
}

async function moveApiaries(trx: Knex.Knex.Transaction, user_id: number) {
  const apiaries = await Apiary.query().where({ user_id });
  const copy = JSON.parse(JSON.stringify(apiaries));
  apiaries.map((apiary) => {
    delete apiary.id;
    delete apiary.edit_id;
    delete apiary.bee_id;
    apiary.user_id = user_id;
    return apiary;
  });

  const insert = await trx.insert(apiaries, ['id']).into('apiaries');
  return oldMap(insert, copy);
}
