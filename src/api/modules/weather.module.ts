import httpErrors from 'http-errors';

import type { Database } from '../../types/database.types.js';
import {
  calculateGruenlandtemperatursumme,
  getHistoricalTemperatures,
  getWeatherData,
} from '../adapters/weather.adapter.js';
import { isPremium } from './premium.module.js';

export async function getApiaryWeather(
  db: Database,
  companyId: number,
  apiaryId: number,
) {
  if (!(await isPremium(companyId, db))) throw httpErrors.PaymentRequired();
  const apiary = await db
    .selectFrom('apiaries')
    .select(['latitude', 'longitude'])
    .where('id', '=', apiaryId)
    .where('user_id', '=', companyId)
    .executeTakeFirst();
  if (!apiary) throw httpErrors.NotFound('Apiary not found');
  return getWeatherData(Number(apiary.latitude), Number(apiary.longitude));
}

export async function getApiaryTemperatureSum(
  db: Database,
  companyId: number,
  apiaryId: number,
  year: number,
) {
  const apiary = await db
    .selectFrom('apiaries')
    .select(['id', 'name', 'latitude', 'longitude', 'elevation'])
    .where('id', '=', apiaryId)
    .where('user_id', '=', companyId)
    .where('deleted', '=', false)
    .executeTakeFirst();
  if (!apiary) throw httpErrors.NotFound();
  if (!apiary.latitude || !apiary.longitude) {
    throw httpErrors.BadRequest('Apiary coordinates not set');
  }
  if (year > new Date().getFullYear()) {
    throw httpErrors.BadRequest('Year cannot be in the future');
  }

  const startDate = `${year}-01-01`;
  const endDate =
    year === new Date().getFullYear()
      ? new Date().toISOString().split('T')[0]
      : `${year}-06-30`;
  const temperatures = await getHistoricalTemperatures(
    Number(apiary.latitude),
    Number(apiary.longitude),
    startDate,
    endDate,
    apiary.elevation,
  );
  return {
    ...calculateGruenlandtemperatursumme(temperatures),
    apiary: {
      id: apiary.id,
      name: apiary.name,
      latitude: Number(apiary.latitude),
      longitude: Number(apiary.longitude),
      elevation: apiary.elevation,
    },
  };
}
