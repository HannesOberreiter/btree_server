import httpErrors from 'http-errors';

import { KyselyServer } from '../../servers/kysely.server.js';

export async function getCompany(api: string) {
  const company = await KyselyServer.getInstance()
    .db.selectFrom('companies')
    .selectAll()
    .where('api_key', '=', api)
    .executeTakeFirst();
  if (!company) throw httpErrors.NotFound();
  return company;
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
  } catch (error) {
    console.error(error);
    return false;
  }
}
