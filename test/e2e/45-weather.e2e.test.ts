import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildApiaryForecast } from '../../src/api/adapters/forecast.parser.js';
import type { OneCallResponse } from '../../src/api/adapters/weather.adapter.js';
import { KyselyServer } from '../../src/servers/kysely.server.js';
import { RedisServer } from '../../src/servers/redis.server.js';
import type { TestAgent } from '../utils.js';
import {
  createAuthenticatedAgent,
  doQueryRequest,
  doRequest,
} from '../utils.js';

const HOUR = 3600;
const DAY = 24 * HOUR;
// 2026-06-01T10:00:00Z, local time 11:00 in Africa/Lagos (UTC+1, no DST)
const NOW = Date.UTC(2026, 5, 1, 10) / 1000;
const MIDNIGHT = Date.UTC(2026, 5, 1) / 1000;

const condition = [{ id: 800, main: 'Clear', description: '', icon: '01d' }];

function hour(dt: number, overrides: Partial<OneCallResponse['hourly'][0]>) {
  return {
    dt,
    temp: 20,
    feels_like: 20,
    pressure: 1015,
    humidity: 50,
    dew_point: 10,
    uvi: 5,
    clouds: 0,
    wind_speed: 2,
    wind_deg: 180,
    pop: 0.1,
    weather: condition,
    ...overrides,
  };
}

function day(index: number, overrides: Partial<OneCallResponse['daily'][0]>) {
  const start = MIDNIGHT + index * DAY;
  return {
    dt: start + 11 * HOUR,
    sunrise: start + 4 * HOUR,
    sunset: start + 19 * HOUR,
    moonrise: 0,
    moonset: 0,
    moon_phase: 0,
    temp: { day: 18, min: 8, max: 22, night: 10, eve: 15, morn: 9 },
    feels_like: { day: 18, night: 10, eve: 15, morn: 9 },
    pressure: 1015,
    humidity: 50,
    dew_point: 10,
    wind_speed: 4,
    wind_deg: 180,
    weather: condition,
    clouds: 0,
    pop: 0.1,
    uvi: 5,
    ...overrides,
  };
}

function oneCall(): OneCallResponse {
  return {
    lat: 47,
    lon: 15,
    timezone: 'Africa/Lagos',
    timezone_offset: HOUR,
    current: {
      dt: NOW,
      sunrise: MIDNIGHT + 4 * HOUR,
      sunset: MIDNIGHT + 19 * HOUR,
      temp: 20.04,
      feels_like: 19.96,
      pressure: 1015,
      humidity: 50,
      dew_point: 10,
      uvi: 5,
      clouds: 0,
      visibility: 10000,
      wind_speed: 2,
      wind_deg: 180,
      rain: { '1h': 0.25 },
      weather: condition,
    },
    hourly: Array.from({ length: 48 }, (_, index) =>
      // 12:00Z on the first day is too windy for flight (6 m/s = 22 km/h).
      hour(NOW + index * HOUR, index === 2 ? { wind_speed: 6 } : {}),
    ),
    daily: [
      day(0, {}),
      day(1, { temp: { ...day(1, {}).temp, min: -1.5 } }),
      day(2, { temp: { ...day(2, {}).temp, max: 31 }, rain: 1.2, pop: 0.5 }),
    ],
    alerts: [
      {
        sender_name: 'GeoSphere Austria',
        event: 'Thunderstorm',
        start: NOW,
        end: NOW + 2 * HOUR,
        description: 'Thunderstorm warning',
        tags: [],
      },
    ],
  };
}

describe('apiary forecast parser', () => {
  it('converts units and uses the local time of the apiary', () => {
    const forecast = buildApiaryForecast(oneCall());

    expect(forecast.timezone).toBe('Africa/Lagos');
    expect(forecast.thresholds).toEqual({
      flight_min_temperature: 12,
      flight_max_precipitation_probability: 30,
      flight_max_wind_speed: 20,
      frost_temperature: 0,
      heat_temperature: 30,
    });
    expect(forecast.current).toEqual({
      time: '2026-06-01T11:00',
      temperature: 20,
      feels_like: 20,
      humidity: 50,
      wind_speed: 7,
      wind_gust: null,
      precipitation: 0.3,
      condition: 800,
      is_day: true,
      flight: true,
    });
    expect(forecast.hourly).toHaveLength(48);
    expect(forecast.hourly[0]).toMatchObject({
      time: '2026-06-01T11:00',
      precipitation_probability: 10,
      wind_speed: 7,
    });
    expect(forecast.alerts).toEqual([
      {
        sender: 'GeoSphere Austria',
        event: 'Thunderstorm',
        start: '2026-06-01T11:00',
        end: '2026-06-01T13:00',
        description: 'Thunderstorm warning',
      },
    ]);
  });

  it('marks flight hours only in daylight with low wind', () => {
    const { hourly } = buildApiaryForecast(oneCall());
    const byTime = new Map(hourly.map((entry) => [entry.time, entry]));

    expect(byTime.get('2026-06-01T12:00')?.flight).toBe(true);
    expect(byTime.get('2026-06-01T13:00')?.flight).toBe(false);
    expect(byTime.get('2026-06-01T20:00')).toMatchObject({
      is_day: false,
      flight: false,
    });
  });

  it('uses the time zone name across a daylight saving time change', () => {
    // Europe/Vienna changes from UTC+2 to UTC+1 at 2026-10-25T01:00:00Z.
    const start = Date.UTC(2026, 9, 24, 22) / 1000;
    const weather = oneCall();
    weather.timezone = 'Europe/Vienna';
    weather.timezone_offset = 2 * HOUR;
    weather.hourly = Array.from({ length: 48 }, (_, index) =>
      hour(start + index * HOUR, {}),
    );

    const { hourly } = buildApiaryForecast(weather);

    expect(hourly.slice(0, 5).map((entry) => entry.time)).toEqual([
      '2026-10-25T00:00',
      '2026-10-25T01:00',
      '2026-10-25T02:00',
      '2026-10-25T02:00',
      '2026-10-25T03:00',
    ]);
    expect(hourly[14].time).toBe('2026-10-25T13:00');
  });

  it('calculates daily flight hours, frost, and heat', () => {
    const { daily } = buildApiaryForecast(oneCall());

    expect(daily.map((entry) => entry.date)).toEqual([
      '2026-06-01',
      '2026-06-02',
      '2026-06-03',
    ]);
    expect(daily[0]).toMatchObject({
      flight_day: true,
      flight_hours: 8,
      frost: false,
      heat: false,
    });
    expect(daily[1]).toMatchObject({
      flight_hours: 15,
      frost: true,
      sunrise: '2026-06-02T05:00',
      sunset: '2026-06-02T20:00',
    });
    // The hourly data ends before the third day ends.
    expect(daily[2]).toMatchObject({
      flight_day: false,
      flight_hours: null,
      heat: true,
      precipitation: 1.2,
      precipitation_probability: 50,
    });
  });
});

describe('/api/v1/service/weather/:apiary_id', () => {
  const route = '/api/v1/service/weather';
  const db = KyselyServer.getInstance().db;
  const redis = new RedisServer();
  let agent: TestAgent;
  let apiaryId: number;
  let companyId: number;
  let paid: Date | null;
  let cacheKey: string;

  beforeAll(async () => {
    await redis.start();
    agent = await createAuthenticatedAgent();
    const res = await doRequest(agent, 'post', '/api/v1/apiary', null, null, {
      name: `WeatherApiary${Date.now()}`,
    });
    apiaryId = res.body.id;
    const apiary = await db
      .selectFrom('apiaries')
      .select(['user_id', 'latitude', 'longitude'])
      .where('id', '=', apiaryId)
      .executeTakeFirstOrThrow();
    companyId = apiary.user_id;
    const company = await db
      .selectFrom('companies')
      .select('paid')
      .where('id', '=', companyId)
      .executeTakeFirstOrThrow();
    paid = company.paid;
    const lat = Number(Number(apiary.latitude).toFixed(2));
    const lon = Number(Number(apiary.longitude).toFixed(2));
    cacheKey = `weather:v2:${lat}:${lon}`;
    // Seed the cache so that the server does not call OpenWeather.
    await RedisServer.client.setEx(cacheKey, 60, JSON.stringify(oneCall()));
  });

  afterAll(async () => {
    try {
      await db
        .updateTable('companies')
        .set({ paid })
        .where('id', '=', companyId)
        .execute();
      await db.deleteFrom('apiaries').where('id', '=', apiaryId).execute();
      await RedisServer.client.del(cacheKey);
    } finally {
      await redis.stop();
    }
  });

  async function setPaid(date: Date) {
    await db
      .updateTable('companies')
      .set({ paid: date })
      .where('id', '=', companyId)
      .execute();
  }

  it('402 - company is not premium', async () => {
    await setPaid(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const res = await doQueryRequest(agent, route, apiaryId, null, null);
    expect(res.statusCode).toEqual(402);
  });

  it('404 - apiary does not exist', async () => {
    await setPaid(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const res = await doQueryRequest(agent, route, 2147483647, null, null);
    expect(res.statusCode).toEqual(404);
  });

  it('200 - returns the forecast', async () => {
    await setPaid(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const res = await doQueryRequest(agent, route, apiaryId, null, null);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(buildApiaryForecast(oneCall()));
  });

  it('404 - apiary is deleted', async () => {
    await setPaid(new Date(Date.now() + 24 * 60 * 60 * 1000));
    await db
      .updateTable('apiaries')
      .set({ deleted: true })
      .where('id', '=', apiaryId)
      .execute();
    const forecast = await doQueryRequest(agent, route, apiaryId, null, null);
    const temperature = await doQueryRequest(
      agent,
      '/api/v1/service/temperature',
      apiaryId,
      null,
      null,
    );
    expect(forecast.statusCode).toEqual(404);
    expect(temperature.statusCode).toEqual(404);
  });
});
