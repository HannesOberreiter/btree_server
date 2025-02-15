import { Company } from '../models/company.model.js';
import { checkMySQLError } from './error.util.js';

export async function getCompany(api: string) {
  try {
    return await Company.query().findOne({ api_key: api }).throwIfNotFound();
  }
  catch (e) {
    throw checkMySQLError(e);
  }
}

/**
 * https://stackoverflow.com/a/44118363/5316675
 * @param tz timezone string to test if valid
 * @returns Boolean
 * @error if environment does not support timezones it throws a new error
 */
export function isValidTimeZone(tz: string) {
  if (!Intl || !Intl.DateTimeFormat().resolvedOptions().timeZone) {
    throw new Error('Time zones are not available in this environment');
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  }
  catch (e) {
    console.error(e);
    return false;
  }
}
