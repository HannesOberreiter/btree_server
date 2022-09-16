import { checkMySQLError } from '@utils/error.util';
import { Company } from '../models/company.model';
import { basicLimit, totalLimit } from '@config/environment.config';
import { Hive } from '../models/hive.model';
import { Apiary } from '../models/apiary.model';
import { Scale } from '../models/scale.model';
import { Payment } from '../models/payment.model';

import dayjs from 'dayjs';

export const isPremium = async (id: number) => {
  try {
    const paid = await Company.query()
      .select('paid')
      .findById(id)
      .throwIfNotFound();
    return paid.isPaid();
  } catch (e) {
    throw checkMySQLError(e);
  }
};

export const limitHive = async (user_id: number, amount: number) => {
  try {
    const premium = await isPremium(user_id);
    if ((amount > basicLimit.hive && !premium) || amount > totalLimit.hive)
      return true;
    const result = await Hive.query()
      .count('id as count')
      .where({ user_id: user_id, deleted: false });
    if (
      (result[0]['count'] + amount > basicLimit.hive && !premium) ||
      result[0]['count'] + amount > totalLimit.hive
    ) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    throw checkMySQLError(e);
  }
};

export const limitApiary = async (user_id: number) => {
  try {
    const premium = await isPremium(user_id);
    const result = await Apiary.query()
      .count('id as count')
      .where({ user_id: user_id, deleted: false });
    if (
      (result[0]['count'] + 1 > basicLimit.apiary && !premium) ||
      result[0]['count'] + 1 > totalLimit.apiary
    ) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    throw checkMySQLError(e);
  }
};

export const limitScale = async (user_id: number) => {
  try {
    const premium = await isPremium(user_id);
    const result = await Scale.query()
      .count('id as count')
      .where({ user_id: user_id });
    if (
      (result[0]['count'] + 1 > basicLimit.scale && !premium) ||
      result[0]['count'] + 1 > totalLimit.scale
    ) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    throw checkMySQLError(e);
  }
};

export const addPremium = async (user_id: number, months = 12, amount = 0, type = '') => {
  return await Company.transaction(async (trx) => {
    const company = await Company.query(trx).select('paid').findById(user_id);
    const newPaid =
      dayjs(company.paid) < dayjs()
        ? dayjs().add(months, 'month')
        : dayjs(company.paid).add(months, 'month');
    const result = await Company.query(trx).patchAndFetchById(user_id, {
      paid: newPaid.format('YYYY-MM-DD'),
    });
    await Payment.query(trx).insert({
      date: new Date(),
      user_id: user_id,
      amount: amount ? amount : 0,
      type: type
    })
    return result.paid;
  });
};
