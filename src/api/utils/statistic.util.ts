import { BaseModel } from '../models/base.model';
import { checkMySQLError } from './error.util';

export const hiveCountApiary = async (date: Date, user_id: number) => {
  try {
    const knex = BaseModel.knex();
    const subquery = knex('movedates')
      .select(
        knex.raw('max(date) as date'),
        'hive_id',
        knex.raw('IF(hives.grouphive > 0, hives.grouphive, 1) as amount'),
        // https://stackoverflow.com/a/58697900/5316675
        knex.raw(
          "SUBSTRING(MAX(CONCAT(TO_CHAR(date, 'YYYY-MM-DD HH:mm:ss'), apiary_id)), 20, 31) as apiary_id"
        ),
        'user_id'
      )
      .leftJoin('hives', 'hives.id', 'movedates.hive_id')
      .where({
        'hives.deleted': 0,
        'hives.modus': 1,
        'hives.user_id': user_id,
      })
      .where('movedates.date', '<=', date)
      .groupBy('hive_id')
      .as('t');

    const result = await knex(subquery)
      .select(
        knex.raw('apiary_id'),
        knex.raw('sum(t.amount) as total'),
        'apiaries.user_id',
        'apiaries.name'
      )
      .leftJoin('apiaries', 'apiaries.id', 't.apiary_id')
      .groupBy('apiary_id');

    return result;
  } catch (e) {
    throw checkMySQLError(e);
  }
};

export const hiveCountTotal = async (user_id: number) => {
  const knex = BaseModel.knex();
  const subquery = knex('movedates')
    .select('hive_id', knex.raw('1 as amount'), 'user_id')
    .leftJoin('hives', 'hives.id', 'movedates.hive_id')
    .where({
      'hives.deleted': 0,
      'hives.user_id': user_id,
    })
    .groupBy('hive_id')
    .as('t');

  const increase = await knex(subquery.select(knex.raw('min(date) as date')))
    .select(
      knex.raw('YEAR(t.date) as year'),
      knex.raw('QUARTER(t.date) as quarter'),
      knex.raw('CONCAT(YEAR(t.date), QUARTER(t.date)) as ident'),
      knex.raw('sum(t.amount) as increase'),
      'user_id'
    )
    .groupBy('year', 'quarter');

  const decrease = await knex(
    subquery
      .select(knex.raw('min(hives.modus_date) as modus_date'))
      .where('hives.modus', 0)
  )
    .select(
      knex.raw('YEAR(t.modus_date) as year'),
      knex.raw('QUARTER(t.modus_date) as quarter'),
      knex.raw('CONCAT(YEAR(t.modus_date), QUARTER(t.modus_date)) as ident'),
      knex.raw('sum(t.amount) as decrease'),
      'user_id'
    )
    .groupBy('year', 'quarter');
  const minYear = Math.min(
    ...(increase
      .map((v) => parseInt(v.year))
      .concat(decrease.map((v) => parseInt(v.year))) as any)
  );
  const maxYear = Math.max(
    ...(increase
      .map((v) => parseInt(v.year))
      .concat(decrease.map((v) => parseInt(v.year))) as any)
  );
  let result = [];
  for (let i = 0; i <= maxYear - minYear; i++) {
    for (let j = 1; j <= 4; j++) {
      result.push({
        year: minYear + i,
        quarter: j,
        ident: minYear + i + '' + j,
      });
    }
  }
  let total = 0;
  result = result.map((i) => {
    let res = Object.assign(
      i,
      decrease.find((b) => i.ident === b.ident)
    );
    res = Object.assign(
      res,
      increase.find((b) => res.ident === b.ident)
    );
    res.change = (res.increase || 0) - (res.decrease || 0);
    res.total = total + res.change;
    total = res.total;
    return res;
  });
  return result;
};
