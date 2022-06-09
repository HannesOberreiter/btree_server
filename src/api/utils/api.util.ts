import { checkMySQLError } from '@utils/error.util';
import { Company } from '../models/company.model';

export const getCompany = async (api: string) => {
  try {
    return await Company.query().findOne({api_key: api}).throwIfNotFound();
  } catch (e) {
    throw checkMySQLError(e);
  }
};
