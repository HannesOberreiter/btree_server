import { checkMySQLError } from '@utils/error.util';
import { Company } from '../models/company.model';
import {
  basicLimit
} from '@config/environment.config';
import { Hive } from '../models/hive.model';
import { Apiary } from '../models/apiary.model';
import { Scale } from '../models/scale.model';

export const isPremium = async (id: number) => {
  try {
      const paid = await Company.query().select('paid').findById(id).throwIfNotFound();
      return paid.isPaid()
  } catch (e) {
        throw checkMySQLError(e);
  }
};

export const limitHive = async (user_id: number, amount: number) => {
  try {
    const premium = await isPremium(user_id);
    if(premium) return false
    if(amount > basicLimit.hive) return true;
    const result = await Hive.query().count("id as count").where({user_id: user_id, deleted: false})
    return result[0]['count'] + amount > basicLimit.hive ? true : false;
  } catch (e) {
    throw checkMySQLError(e);
  }
}

export const limitApiary = async (user_id: number) => {
  try {
    const premium = await isPremium(user_id);
    if(premium) return false
    const result = await Apiary.query().count("id as count").where({user_id: user_id, deleted: false})
    return result[0]['count'] + 1 > basicLimit.apiary ? true : false;
  } catch (e) {
    throw checkMySQLError(e);
  }
}

export const limitScale = async (user_id: number) => {
  try {
    const premium = await isPremium(user_id);
    if(premium) return false
    const result = await Scale.query().count("id as count").where({user_id: user_id})
    return result[0]['count'] + 1 > basicLimit.scale ? true : false;
  } catch (e) {
    throw checkMySQLError(e);
  }
}
