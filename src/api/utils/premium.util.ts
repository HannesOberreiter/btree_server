import dayjs from 'dayjs';

import { basicLimit, totalLimit } from '../../config/environment.config.js';
import { Apiary } from '../models/apiary.model.js';
import { Company } from '../models/company.model.js';
import { Hive } from '../models/hive.model.js';
import { Payment } from '../models/payment.model.js';
import { Scale } from '../models/scale.model.js';
import { checkMySQLError } from '../utils/error.util.js';

export async function isPremium(id: number) {
  const paid = await Company.query()
    .select('paid')
    .findById(id)
    .throwIfNotFound();
  return paid.isPaid();
}

export async function limitHive(user_id: number, amount: number) {
  try {
    const premium = await isPremium(user_id);
    if ((amount > basicLimit.hive && !premium) || amount > totalLimit.hive)
      return true;
    const result = await Hive.query()
      .count('id as count')
      .where({ user_id, deleted: false }) as Hive[] & { count: number }[];
    if (
      (result[0].count + amount > basicLimit.hive && !premium)
      || result[0].count + amount > totalLimit.hive
    ) {
      return true;
    }
    else {
      return false;
    }
  }
  catch (e) {
    throw checkMySQLError(e);
  }
}

export async function limitApiary(user_id: number) {
  try {
    const premium = await isPremium(user_id);
    const result = await Apiary.query()
      .count('id as count')
      .where({ user_id, deleted: false }) as Apiary[] & { count: number }[];
    if (
      (result[0].count + 1 > basicLimit.apiary && !premium)
      || result[0].count + 1 > totalLimit.apiary
    ) {
      return true;
    }
    else {
      return false;
    }
  }
  catch (e) {
    throw checkMySQLError(e);
  }
}

export async function limitScale(user_id: number) {
  try {
    const premium = await isPremium(user_id);
    const result = await Scale.query()
      .count('id as count')
      .where({ user_id }) as Scale[] & { count: number }[];
    if (
      (result[0].count + 1 > basicLimit.scale && !premium)
      || result[0].count + 1 > totalLimit.scale
    ) {
      return true;
    }
    else {
      return false;
    }
  }
  catch (e) {
    throw checkMySQLError(e);
  }
}

export async function addPremium(user_id: number, months = 12, amount = 0, type: undefined | 'paypal' | 'promo' | 'stripe') {
  return await Company.transaction(async (trx) => {
    const company = await Company.query(trx).select('paid').findById(user_id);
    const newPaid
      = dayjs(company.paid) < dayjs()
        ? dayjs().add(months, 'month')
        : dayjs(company.paid).add(months, 'month');
    const result = await Company.query(trx).patchAndFetchById(user_id, {
      paid: newPaid.format('YYYY-MM-DD'),
    });
    await Payment.query(trx).insert({
      date: new Date(),
      user_id,
      months,
      amount: amount || 0,
      type,
    });
    return result.paid;
  });
}
