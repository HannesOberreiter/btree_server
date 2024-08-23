import { FastifyReply, FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';
import { randomBytes } from 'crypto';
import archiver from 'archiver';
import yauzl from 'yauzl-promise';
import { Options, stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';

import { Company } from '../models/company.model.js';
import { reviewPassword } from '../utils/login.util.js';
import { CompanyBee } from '../models/company_bee.model.js';
import { autoFill } from '../utils/autofill.util.js';
import { User } from '../models/user.model.js';
import UserController from '../controllers/user.controller.js';
import { deleteCompany } from '../utils/delete.util.js';
import { addPremium, isPremium } from '../utils/premium.util.js';
import { Apiary } from '../models/apiary.model.js';
import { Hive } from '../models/hive.model.js';
import { Movedate } from '../models/movedate.model.js';
import { Checkup } from '../models/checkup.model.js';
import { Feed } from '../models/feed.model.js';
import { Treatment } from '../models/treatment.model.js';
import { Harvest } from '../models/harvest.model.js';
import { Scale } from '../models/scale.model.js';
import { ScaleData } from '../models/scale_data.model.js';
import { Rearing } from '../models/rearing/rearing.model.js';
import { RearingType } from '../models/rearing/rearing_type.model.js';
import { Promo } from '../models/promos.model.js';
import { Counts } from '../models/counts.model.js';
import { HiveType } from '../models/option/hive_type.mode.js';
import { HiveSource } from '../models/option/hive_source.model.js';
import { CheckupType } from '../models/option/checkup_type.model.js';
import { FeedType } from '../models/option/feed_type.model.js';
import { TreatmentType } from '../models/option/treatment_type.model.js';
import { TreatmentDisease } from '../models/option/treatment_disease.model.js';
import { TreatmentVet } from '../models/option/treatment_vet.model.js';
import { HarvestType } from '../models/option/harvest_type.model.js';
import { Charge } from '../models/charge.model.js';
import { ChargeType } from '../models/option/charge_type.model.js';
import { Queen } from '../models/queen.model.js';
import { QueenMating } from '../models/option/queen_mating.model.js';
import { QueenRace } from '../models/option/queen_race.model.js';
import { Todo } from '../models/todo.model.js';
import Objection from 'objection';
import { Stream } from 'stream';

export default class CompanyController {
  static async postCoupon(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const promo = await Promo.query()
      .select()
      .where({ code: body.coupon, used: false })
      .throwIfNotFound()
      .first();
    const paid = await addPremium(
      req.session.user.user_id,
      promo.months,
      0,
      'promo',
    );
    await Promo.query()
      .patch({
        used: true,
        date: new Date(),
        user_id: req.session.user.user_id,
      })
      .findById(promo.id);
    return { paid: paid };
  }

  static async download(req: FastifyRequest, reply: FastifyReply) {
    const pass = new Stream.PassThrough();

    reply.header('Content-Type', 'application/octet-stream');
    reply.header(
      'Content-Disposition',
      `attachment; filename="btree_data_${Date.now()}.zip"`,
    );

    const arch = archiver('zip');
    arch.on('error', (err) => {
      throw err;
    });
    arch.pipe(pass);

    await downloadData(arch, req.session.user.user_id);
    await arch.finalize();
    return pass;
  }

  static async getApikey(req: FastifyRequest, reply: FastifyReply) {
    const premium = await isPremium(req.session.user.user_id);
    if (!premium) {
      throw httpErrors.PaymentRequired();
    }
    const result = await Company.query()
      .select('api_key')
      .findById(req.session.user.user_id);
    return { ...result };
  }

  static async getCounts(req: FastifyRequest, reply: FastifyReply) {
    const result = await Counts.query().where(
      'user_id',
      req.session.user.user_id,
    );
    return result;
  }

  static async delete(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { id: string };
    const otherUser = await Company.query()
      .select('user.id')
      .withGraphJoined('user')
      .whereNot({
        'user.id': req.session.user.bee_id,
      })
      .where({
        'companies.id': params.id,
      });
    if (otherUser.length > 0) {
      reply.send(
        httpErrors.Forbidden('Other user(s) found, please remove them first.'),
      );
      return;
    }

    const otherCompanies = await Company.query()
      .select('companies.id as id')
      .withGraphJoined('user')
      .where({
        'user.id': req.session.user.bee_id,
      })
      .whereNot({
        'companies.id': params.id,
      });
    if (otherCompanies.length === 0) {
      reply.send(
        httpErrors.Forbidden(
          'This is your last company, you cannot delete it.',
        ),
      );
      return;
    }

    req.body['saved_company'] = otherCompanies[0].id;

    await deleteCompany(parseInt(params.id));

    return await UserController.changeCompany(req, reply);
  }

  static async post(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as { name: string };
    const result = await Company.transaction(async (trx) => {
      const check = await Company.query(trx)
        .select('companies.id')
        .withGraphJoined('user')
        .where({
          name: body.name,
          'user.id': req.session.user.bee_id,
        });
      if (check.length > 0) {
        throw httpErrors.Conflict('Company name already exists');
      }
      const c = await Company.query(trx).insert({ name: body.name });
      const u = await User.query(trx)
        .select('lang')
        .findById(req.session.user.bee_id);
      await CompanyBee.query(trx).insert({
        bee_id: req.session.user.bee_id,
        user_id: c.id,
      });
      await autoFill(trx, c.id, u.lang);
      return c;
    });
    return { ...result };
  }

  static async patch(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as {
      name: string;
      password?: string;
      api_change?: boolean;
    };
    if ('password' in body) {
      await reviewPassword(req.session.user.bee_id, body.password);
      delete body.password;
    }
    const result = await Company.transaction(async (trx) => {
      const company = await Company.query(trx).findById(
        req.session.user.user_id,
      );
      let api_change = false;
      if ('api_change' in body) {
        const premium = await isPremium(req.session.user.user_id);
        if (!premium) {
          throw httpErrors.PaymentRequired();
        }
        api_change = body.api_change ? true : false;
        delete body.api_change;
      }

      const res = await company.$query(trx).patchAndFetch({ ...body });

      if (
        api_change ||
        (res.api_active && (res.api_key === '' || res.api_key === null))
      ) {
        const apiKey = randomBytes(25).toString('hex');
        await company.$query(trx).patch({
          api_key: apiKey,
        });
      }
      delete res.api_key;
      return res;
    });
    return { ...result };
  }

  /**
   * @description Import data for new company from CSV files, which are previously generated by the download function.
   */
  static async import(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const data = {
      hives: [],
      hive_types: [],
      hive_sources: [],
      apiaries: [],
      movedates: [],
      checkups: [],
      checkup_types: [],
      feeds: [],
      feed_types: [],
      treatments: [],
      treatment_types: [],
      treatment_diseases: [],
      treatment_vets: [],
      harvests: [],
      harvest_types: [],
      charges: [],
      charge_types: [],
      queens: [],
      queen_matings: [],
      queen_races: [],
      todos: [],
    };
    const keys = Object.keys(data);
    const zip = await yauzl.fromBuffer(body.upload);
    try {
      for await (const entry of zip) {
        const name = entry.filename.split('.')[0];
        if (keys.includes(name)) {
          const readStream = await entry.openReadStream();
          let chunks = [];
          for await (const chunk of readStream) {
            chunks.push(chunk);
          }
          const content = Buffer.concat(chunks);
          data[name] = await parseCSV(content.toString());
        }
      }
    } finally {
      await zip.close();
    }
    const name = Date.now() + '';
    /** 4 days after import probably seems fair and does prevent misuse */
    const paid = new Date();
    paid.setDate(paid.getDate() + 4);

    await Company.transaction(async (trx) => {
      const company = await Company.query(trx).insert({
        name,
        paid: paid.toISOString().slice(0, 10),
      });
      await CompanyBee.query(trx).insert({
        bee_id: req.session.user.bee_id,
        user_id: company.id,
      });
      const apiaries = await moveApiaries(trx, company.id, data.apiaries);
      if (!apiaries) {
        throw httpErrors.BadRequest('No apiaries to move');
      }
      const hives = await moveHives(trx, company.id, data);
      if (!hives) {
        throw httpErrors.BadRequest('No hives to move');
      }
      if (data.movedates.length === 0) {
        throw httpErrors.BadRequest('No moves to move');
      }
      removeKeys(data.movedates);
      data.movedates.map((move) => {
        move.apiary_id = apiaries[move.apiary_id];
        move.hive_id = hives[move.hive_id];
        return move;
      });
      await insert(Movedate.query(trx), data.movedates);

      await moveCharges(trx, company.id, data);
      await moveTodos(trx, company.id, data);
      await moveTreatments(trx, company.id, data, hives);
      await moveHarvests(trx, company.id, data, hives);
      await moveFeeds(trx, company.id, data, hives);
      await moveCheckups(trx, company.id, data, hives);
      await moveQueens(trx, company.id, data, hives);
    });

    return { name: name };
  }
}

/**
 * @description some fields need special attention on import, therefore we check a few jsonSchemas to get the names
 */
async function specialTypes() {
  const booleanFields = [];
  const dateFields = [];
  const isoDateFields = [];

  const properties = [
    Hive.jsonSchema.properties,
    Checkup.jsonSchema.properties,
    CheckupType.jsonSchema.properties,
    Charge.jsonSchema.properties,
    Queen.jsonSchema.properties,
    Movedate.jsonSchema.properties,
  ];

  properties.map((property) => {
    for (const key of Object.keys(property)) {
      const item = property[key];
      if (item.type === 'boolean') {
        booleanFields.push(key);
      } else if (item.format === 'date') {
        dateFields.push(key);
      } else if (item.format === 'iso-date-time') {
        isoDateFields.push(key);
      }
    }
  });
  return {
    booleanFields,
    dateFields,
    isoDateFields,
  };
}

async function parseCSV(csv: string) {
  const exceptions = await specialTypes();

  const results = parse(csv, {
    columns: true,
    autoParse: false,
    cast: false,
    to: 1_000_000,
    skipEmptyLines: true,
    onRecord: (record, context) => {
      if (context.header) {
        return;
      }
      for (let key of Object.keys(record)) {
        if (
          record[key] === '' ||
          record[key] === null ||
          record[key] === undefined
        ) {
          delete record[key];
        } else if (exceptions.booleanFields.includes(key)) {
          /** convert to boolean, ajv coercing does not work for strings to boolean */
          record[key] = record[key] === '1';
        } else if (exceptions.isoDateFields.includes(key)) {
          /** prepare for direct insert into db */
          if (record[key]) {
            record[key] = record[key].slice(0, 19).replace('T', ' ');
          } else {
            delete record[key];
          }
        } else if (exceptions.dateFields.includes(key)) {
          /** convert to short date */
          record[key] = record[key].slice(0, 10);
          if (record[key] === '0000-00-00') {
            delete record[key];
          }
        }
      }
      return record;
    },
  });
  return results;
}

const removeKeys = (
  records: Record<string, any>[],
  removeList = ['id', 'bee_id', 'edit_id'],
) => {
  records.map((record) => {
    Object.keys(record).forEach((key) => {
      if (record[key] === undefined) {
        delete record[key];
      } else if (typeof record[key] === 'object') {
        delete record[key];
      } else if (removeList.includes(key)) {
        delete record[key];
      }
    });
  });
};

const oldMap = (insert: Array<{ id: number }>, copy: Array<{ id: number }>) => {
  const oldMap: Record<string, number> = {};
  insert.forEach((item, index) => {
    oldMap[copy[index].id] = item.id;
  });
  return oldMap;
};

const insert = async (q: Objection.QueryBuilder<any>, insert: any[]) => {
  const ids = [];
  for (let i = 0; i < insert.length; i++) {
    const query = q.clone();
    const id = await query.insert(insert[i]);
    ids.push(id);
  }
  return ids;
};

async function moveCharges(
  trx: Objection.Transaction,
  user_id: number,
  data: Record<string, any[]>,
) {
  if (data.charge_types.length === 0) return;
  const copyTypes = JSON.parse(JSON.stringify(data.charge_types));
  removeKeys(data.charge_types);
  data.charge_types.map((type) => {
    type.user_id = user_id;
    return type;
  });
  const insertTypes = await insert(ChargeType.query(trx), data.charge_types);
  const oldMapTypes = oldMap(insertTypes, copyTypes);

  if (data.charges.length === 0) return;
  removeKeys(data.charges);
  data.charges.map((charge) => {
    charge.user_id = user_id;
    charge.type_id = oldMapTypes[charge.type_id];
    return charge;
  });
  await insert(Charge.query(trx), data.charges);
}

async function moveTodos(
  trx: Objection.Transaction,
  user_id: number,
  data: Record<string, any>,
) {
  if (data.todos.length === 0) return;
  removeKeys(data.todos);
  data.todos.map((todo) => {
    todo.user_id = user_id;
    return todo;
  });
  await insert(Todo.query(trx), data.todos);
}

async function moveTreatments(
  trx: Objection.Transaction,
  user_id: number,
  data: Record<string, any[]>,
  hives: Record<string, number>,
) {
  if (data.treatment_types.length === 0) return;
  const copyTypes = JSON.parse(JSON.stringify(data.treatment_types));
  removeKeys(data.treatment_types);
  data.treatment_types.map((type) => {
    type.user_id = user_id;
    return type;
  });
  const insertTypes = await insert(
    TreatmentType.query(trx),
    data.treatment_types,
  );
  const oldMapTypes = oldMap(insertTypes, copyTypes);

  if (data.treatment_diseases.length === 0) return;
  const copyDiseases = JSON.parse(JSON.stringify(data.treatment_diseases));
  removeKeys(data.treatment_diseases);
  data.treatment_diseases.map((disease) => {
    disease.user_id = user_id;
    return disease;
  });
  const insertDiseases = await insert(
    TreatmentDisease.query(trx),
    data.treatment_diseases,
  );
  const oldMapDiseases = oldMap(insertDiseases, copyDiseases);

  if (data.treatment_vets.length === 0) return;
  const copyVets = JSON.parse(JSON.stringify(data.treatment_vets));
  removeKeys(data.treatment_vets);
  data.treatment_vets.map((vet) => {
    vet.user_id = user_id;
    return vet;
  });
  const insertVets = await insert(TreatmentVet.query(trx), data.treatment_vets);
  const oldMapVets = oldMap(insertVets, copyVets);

  if (data.treatments.length === 0) return;
  removeKeys(data.treatments);
  data.treatments.map((treatment) => {
    treatment.user_id = user_id;
    treatment.hive_id = hives[treatment.hive_id];
    treatment.type_id = oldMapTypes[treatment.type_id];
    treatment.disease_id = oldMapDiseases[treatment.disease_id];
    treatment.vet_id = oldMapVets[treatment.vet_id];
    return treatment;
  });
  await insert(Treatment.query(trx), data.treatments);
}

async function moveHarvests(
  trx: Objection.Transaction,
  user_id: number,
  data: Record<string, any[]>,
  hives: Record<string, number>,
) {
  if (data.harvest_types.length === 0) return;
  const copyTypes = JSON.parse(JSON.stringify(data.harvest_types));
  removeKeys(data.harvest_types);
  data.harvest_types.map((type) => {
    type.user_id = user_id;
    return type;
  });
  const insertTypes = await insert(HarvestType.query(trx), data.harvest_types);
  const oldMapTypes = oldMap(insertTypes, copyTypes);

  if (data.harvests.length === 0) return;
  removeKeys(data.harvests);
  data.harvests.map((harvest) => {
    harvest.user_id = user_id;
    harvest.hive_id = hives[harvest.hive_id];
    harvest.type_id = oldMapTypes[harvest.type_id];
    return harvest;
  });
  await insert(Harvest.query(trx), data.harvests);
}

async function moveFeeds(
  trx: Objection.Transaction,
  user_id: number,
  data: Record<string, any[]>,
  hives: Record<string, number>,
) {
  if (data.feed_types.length === 0) return;
  const copyTypes = JSON.parse(JSON.stringify(data.feed_types));
  removeKeys(data.feed_types);
  data.feed_types.map((type) => {
    type.user_id = user_id;
    return type;
  });
  const insertTypes = await insert(FeedType.query(trx), data.feed_types);
  const oldMapTypes = oldMap(insertTypes, copyTypes);

  if (data.feeds.length === 0) return;
  removeKeys(data.feeds);
  data.feeds.map((feed) => {
    feed.user_id = user_id;
    feed.hive_id = hives[feed.hive_id];
    feed.type_id = oldMapTypes[feed.type_id];
    return feed;
  });
  await insert(Feed.query(trx), data.feeds);
}

async function moveCheckups(
  trx: Objection.Transaction,
  user_id: number,
  data: Record<string, any[]>,
  hives: Record<string, number>,
) {
  if (data.checkup_types.length === 0) return;
  const copyTypes = JSON.parse(JSON.stringify(data.checkup_types));
  removeKeys(data.checkup_types);
  data.checkup_types.map((type) => {
    type.user_id = user_id;
    return type;
  });
  const insertTypes = await insert(CheckupType.query(trx), data.checkup_types);
  const oldMapTypes = oldMap(insertTypes, copyTypes);

  if (data.checkups.length === 0) return;
  removeKeys(data.checkups);
  data.checkups.map((checkup) => {
    checkup.user_id = user_id;
    checkup.hive_id = hives[checkup.hive_id];
    checkup.type_id = oldMapTypes[checkup.type_id];
    return checkup;
  });
  await await insert(Checkup.query(trx), data.checkups);
}

async function moveQueens(
  trx: Objection.Transaction,
  user_id: number,
  data: Record<string, any[]>,
  hives: Record<string, number>,
) {
  if (data.queen_races.length === 0) return;
  const copyRaces = JSON.parse(JSON.stringify(data.queen_races));
  removeKeys(data.queen_races);
  data.queen_races.map((race) => {
    race.user_id = user_id;
    return race;
  });
  const insertRaces = await insert(QueenRace.query(trx), data.queen_races);
  const oldMapRaces = oldMap(insertRaces, copyRaces);

  if (data.queen_matings.length === 0) return;
  const copyMatings = JSON.parse(JSON.stringify(data.queen_matings));
  removeKeys(data.queen_matings);
  data.queen_matings.map((mating) => {
    mating.user_id = user_id;
    return mating;
  });
  const insertMatings = await insert(
    QueenMating.query(trx),
    data.queen_matings,
  );
  const oldMapMatings = oldMap(insertMatings, copyMatings);

  if (data.queens.length === 0) return;
  removeKeys(data.queens);
  data.queens.map((queen) => {
    queen.user_id = user_id;
    queen.hive_id = hives[queen.hive_id];
    queen.race_id = oldMapRaces[queen.race_id];
    queen.mating_id = oldMapMatings[queen.mating_id];
    queen.mother_id = null; /* we drop own mothers for server swap */
    return queen;
  });
  await insert(Queen.query(trx), data.queens);
  return;
}

async function moveHives(
  trx: Objection.Transaction,
  user_id: number,
  data: Record<string, any[]>,
) {
  if (data.hive_types.length === 0) return;
  const copyTypes = JSON.parse(JSON.stringify(data.hive_types));
  removeKeys(data.hive_types);
  data.hive_types.map((hiveType) => {
    hiveType.user_id = user_id;
    return hiveType;
  });
  const insertTypes = await insert(HiveType.query(trx), data.hive_types);
  const oldMapTypes = oldMap(insertTypes, copyTypes);

  if (data.hive_sources.length === 0) {
    return undefined;
  }
  const copySource = JSON.parse(JSON.stringify(data.hive_sources));
  removeKeys(data.hive_sources);
  data.hive_sources.map((source) => {
    source.user_id = user_id;
    return source;
  });
  const insertSource = await insert(HiveSource.query(trx), data.hive_sources);
  const oldMapSource = oldMap(insertSource, copySource);

  if (data.hives.length === 0) {
    return undefined;
  }
  const copyHives = JSON.parse(JSON.stringify(data.hives));
  removeKeys(data.hives);
  data.hives.map((hive) => {
    hive.user_id = user_id;
    hive.type_id = oldMapTypes[hive.type_id];
    hive.source_id = oldMapSource[hive.source_id];
    return hive;
  });

  const insertHives = await insert(Hive.query(trx), data.hives);
  return oldMap(insertHives, copyHives);
}

async function moveApiaries(
  trx: Objection.Transaction,
  user_id: number,
  data: Record<string, any>[],
) {
  if (data.length === 0) return;
  const copy = JSON.parse(JSON.stringify(data));
  removeKeys(data);
  data.map((item) => {
    item.latitude = parseFloat(item.latitude);
    item.longitude = parseFloat(item.longitude);
    item.user_id = user_id;
    return data;
  });
  const a = await insert(Apiary.query(trx), data);
  return oldMap(a, copy);
}

async function downloadData(arch: archiver.Archiver, user_id: number) {
  const stringifyOptions: Options = {
    header: true,
    cast: {
      date: function (value) {
        return value.toISOString();
      },
      string: function (value) {
        return value.replace(/(\r\n|\n|\r|")/gm, ' ');
      },
      boolean: function (value) {
        if (value === null) return '';
        return value ? '1' : '0';
      },
    },
    record_delimiter: 'windows',
  };

  const company = await Company.query().findById(user_id);
  arch.append(stringify([company], stringifyOptions), {
    name: 'company.csv',
  });
  const apiaries = await Apiary.query().where('user_id', user_id);
  arch.append(stringify(apiaries, stringifyOptions), {
    name: 'apiaries.csv',
  });
  const hives = await Hive.query().where('user_id', user_id);
  arch.append(stringify(hives, stringifyOptions), { name: 'hives.csv' });

  const hiveTypes = await HiveType.query().where('user_id', user_id);
  arch.append(stringify(hiveTypes, stringifyOptions), {
    name: 'hive_types.csv',
  });
  const hiveSources = await HiveSource.query().where('user_id', user_id);
  arch.append(stringify(hiveSources, stringifyOptions), {
    name: 'hive_sources.csv',
  });

  const movedates = await Movedate.query()
    .withGraphJoined('apiary')
    .where('user_id', user_id);
  arch.append(stringify(movedates, stringifyOptions), {
    name: 'movedates.csv',
  });
  const checkups = await Checkup.query()
    .withGraphJoined('type')
    .where('checkups.user_id', user_id);
  arch.append(stringify(checkups, stringifyOptions), {
    name: 'checkups.csv',
  });
  const checkupTypes = await CheckupType.query().where('user_id', user_id);
  arch.append(stringify(checkupTypes, stringifyOptions), {
    name: 'checkup_types.csv',
  });

  const feeds = await Feed.query()
    .withGraphJoined('type')
    .where('feeds.user_id', user_id);
  arch.append(stringify(feeds, stringifyOptions), { name: 'feeds.csv' });
  const feedTypes = await FeedType.query().where('user_id', user_id);
  arch.append(stringify(feedTypes, stringifyOptions), {
    name: 'feed_types.csv',
  });

  const treatments = await Treatment.query()
    .withGraphJoined('[type, disease, vet]')
    .where('treatments.user_id', user_id);
  arch.append(stringify(treatments, stringifyOptions), {
    name: 'treatments.csv',
  });
  const treatmentTypes = await TreatmentType.query().where('user_id', user_id);
  arch.append(stringify(treatmentTypes, stringifyOptions), {
    name: 'treatment_types.csv',
  });
  const treatmentDiseases = await TreatmentDisease.query().where(
    'user_id',
    user_id,
  );
  arch.append(stringify(treatmentDiseases, stringifyOptions), {
    name: 'treatment_diseases.csv',
  });
  const treatmentVets = await TreatmentVet.query().where('user_id', user_id);
  arch.append(stringify(treatmentVets, stringifyOptions), {
    name: 'treatment_vets.csv',
  });

  const harvests = await Harvest.query()
    .withGraphJoined('type')
    .where('harvests.user_id', user_id);
  arch.append(stringify(harvests, stringifyOptions), {
    name: 'harvests.csv',
  });
  const harvestTypes = await HarvestType.query().where('user_id', user_id);
  arch.append(stringify(harvestTypes, stringifyOptions), {
    name: 'harvest_types.csv',
  });

  const charges = await Charge.query().where('user_id', user_id);
  arch.append(stringify(charges, stringifyOptions), {
    name: 'charges.csv',
  });
  const chargeTypes = await ChargeType.query().where('user_id', user_id);
  arch.append(stringify(chargeTypes, stringifyOptions), {
    name: 'charge_types.csv',
  });

  const queens = await Queen.query().where('user_id', user_id);
  arch.append(stringify(queens, stringifyOptions), {
    name: 'queens.csv',
  });
  const queenMatings = await QueenMating.query().where('user_id', user_id);
  arch.append(stringify(queenMatings, stringifyOptions), {
    name: 'queen_matings.csv',
  });
  const queenRaces = await QueenRace.query().where('user_id', user_id);
  arch.append(stringify(queenRaces, stringifyOptions), {
    name: 'queen_races.csv',
  });

  const scales = await Scale.query().where('user_id', user_id);
  arch.append(stringify(scales, stringifyOptions), {
    name: 'scales.csv',
  });
  const scale_data = await ScaleData.query()
    .withGraphJoined('scale')
    .where('scale.user_id', user_id);
  arch.append(stringify(scale_data, stringifyOptions), {
    name: 'scale_data.csv',
  });
  const rearings = await Rearing.query().where('user_id', user_id);
  arch.append(stringify(rearings, stringifyOptions), {
    name: 'rearings.csv',
  });
  const rearing_types = await RearingType.query()
    .withGraphJoined('[detail, step]')
    .where('rearing_types.user_id', user_id);
  arch.append(stringify(rearing_types, stringifyOptions), {
    name: 'rearing_types.csv',
  });

  const todos = await Todo.query().where('user_id', user_id);
  arch.append(stringify(todos, stringifyOptions), {
    name: 'todos.csv',
  });
}
