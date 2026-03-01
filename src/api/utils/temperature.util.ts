import httpErrors from 'http-errors';

import { openweatherKey } from '../../config/environment.config.js';
import { KyselyServer } from '../../servers/kysely.server.js';
import { RedisServer } from '../../servers/redis.server.js';
import { Logger } from '../../services/logger.service.js';

/**
 * OpenWeather One Call API 3.0 Response
 * @see https://openweathermap.org/api/one-call-3
 */
export interface OneCallResponse {
  lat: number
  lon: number
  timezone: string
  timezone_offset: number
  current: {
    dt: number
    sunrise: number
    sunset: number
    temp: number
    feels_like: number
    pressure: number
    humidity: number
    dew_point: number
    uvi: number
    clouds: number
    visibility: number
    wind_speed: number
    wind_deg: number
    wind_gust?: number
    weather: Array<{
      id: number
      main: string
      description: string
      icon: string
    }>
  }
  daily: Array<{
    dt: number
    sunrise: number
    sunset: number
    moonrise: number
    moonset: number
    moon_phase: number
    summary?: string
    temp: {
      day: number
      min: number
      max: number
      night: number
      eve: number
      morn: number
    }
    feels_like: {
      day: number
      night: number
      eve: number
      morn: number
    }
    pressure: number
    humidity: number
    dew_point: number
    wind_speed: number
    wind_deg: number
    wind_gust?: number
    weather: Array<{
      id: number
      main: string
      description: string
      icon: string
    }>
    clouds: number
    pop: number
    rain?: number
    snow?: number
    uvi: number
  }>
  alerts?: Array<{
    sender_name: string
    event: string
    start: number
    end: number
    description: string
    tags: string[]
  }>
}

/**
 * Get weather data using OpenWeather One Call API 3.0
 * Provides current weather, daily forecast (8 days), and alerts in a single call
 * Results are cached in Redis for 1 hour to reduce API calls
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @returns Complete weather data including current conditions and forecast
 */
export async function getWeatherData(latitude: number, longitude: number): Promise<OneCallResponse> {
  // Create cache key based on coordinates (rounded to 4 decimal places for ~11m precision)
  const lat = Number(latitude.toFixed(4));
  const lon = Number(longitude.toFixed(4));
  const cacheKey = `weather:${lat}:${lon}`;

  try {
    const cached = await RedisServer.client.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as OneCallResponse;
    }
  }
  catch (error) {
    Logger.getInstance().log('warn', 'Redis cache read error', {
      label: 'Weather Cache',
      error,
    });
  }

  // OpenWeather One Call API 3.0
  // https://openweathermap.org/api/one-call-3
  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly&units=metric&appid=${openweatherKey}`;

  try {
    const response = await fetch(url);
    const result = await response.json();

    if (response.status !== 200) {
      throw httpErrors.BadRequest(result.message || 'OpenWeather error');
    }

    // Cache the result for 1 hour (3600 seconds)
    try {
      await RedisServer.client.setex(cacheKey, 3600, JSON.stringify(result));
    }
    catch (error) {
      Logger.getInstance().log('warn', 'Redis cache write error', {
        label: 'Weather Cache',
        error,
      });
    }

    return result as OneCallResponse;
  }
  catch (error) {
    Logger.getInstance().log('error', 'OpenWeather One Call API error', {
      label: 'OpenWeather',
      error,
    });
    throw httpErrors.ServiceUnavailable('OpenWeather error');
  }
}

/**
 * Fetch historical daily mean temperatures from Open-Meteo Archive API
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Array of daily temperature data with dates
 */
export async function getHistoricalTemperatures(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string,
): Promise<Array<{ date: string, temperature: number }>> {
  // Open-Meteo Archive API - Free with rate limits (10,000 requests/day)
  // https://open-meteo.com/en/docs/historical-weather-api
  const url = `https://historical-forecast-api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_mean&timezone=auto&models=best_match`;

  try {
    const response = await fetch(url);
    const result = await response.json();

    if (result.error) {
      throw httpErrors.BadRequest(result.reason || result.error);
    }

    if (!result.daily || !result.daily.time || !result.daily.temperature_2m_mean) {
      throw httpErrors.ServiceUnavailable('Invalid response from Open-Meteo');
    }

    // Convert parallel arrays to array of objects
    return result.daily.time.map((date: string, index: number) => ({
      date,
      temperature: result.daily.temperature_2m_mean[index],
    }));
  }
  catch (error) {
    Logger.getInstance().log('error', 'Open-Meteo error', {
      label: 'OpenMeteo',
      error,
    });
    throw httpErrors.ServiceUnavailable('Open-Meteo error');
  }
}

/**
 * Calculate Grünlandtemperatursumme (grassland temperature sum) for vegetation monitoring
 * Formula: Sum of (daily mean temp > 0°C) × monthly correction factor
 * - January: factor 0.5
 * - February: factor 0.75
 * - March onwards: factor 1.0
 * @see https://de.wikipedia.org/wiki/Gr%C3%BCnlandtemperatursumme
 * @param dailyTemperatures - Array of {date, temperature} objects
 * @returns Object with daily cumulative GTS values for graphing
 */
export function calculateGruenlandtemperatursumme(
  dailyTemperatures: Array<{ date: string, temperature: number }>,
) {
  let cumulativeGts = 0;
  const dailyData: Array<{
    date: string
    temperature: number
    dailyGts: number
    cumulativeGts: number
  }> = [];

  for (const day of dailyTemperatures) {
    let dailyGtsContribution = 0;

    if (day.temperature != null && day.temperature > 0) {
      const date = new Date(day.date);
      const month = date.getMonth() + 1; // getMonth() is zero-based

      let factor = 1.0;
      if (month === 1) {
        factor = 0.5; // January
      }
      else if (month === 2) {
        factor = 0.75; // February
      }
      // March onwards: factor = 1.0 (default)

      dailyGtsContribution = day.temperature * factor;
      cumulativeGts += dailyGtsContribution;
    }

    dailyData.push({
      date: day.date,
      temperature: day.temperature,
      dailyGts: Math.round(dailyGtsContribution * 10) / 10,
      cumulativeGts: Math.round(cumulativeGts * 10) / 10,
    });
  }

  return {
    daily: dailyData,
    totalGts: Math.round(cumulativeGts * 10) / 10,
    period: {
      start: dailyTemperatures[0]?.date,
      end: dailyTemperatures[dailyTemperatures.length - 1]?.date,
      days: dailyTemperatures.length,
    },
  };
}

/**
 * Get weather data for a specific apiary by ID
 * Fetches the apiary's coordinates from the database and retrieves weather data
 * @param apiaryId - The apiary ID
 * @param userId - The user ID (company ID) for ownership verification
 * @returns Complete weather data including current conditions and forecast
 * @throws NotFound if apiary doesn't exist or doesn't belong to the user
 */
export async function getWeatherDataForApiary(
  apiaryId: number,
  userId: number,
): Promise<OneCallResponse> {
  const db = KyselyServer.getInstance().db;

  const apiary = await db
    .selectFrom('apiaries')
    .select(['latitude', 'longitude'])
    .where('id', '=', apiaryId)
    .where('user_id', '=', userId)
    .where('deleted', '=', 0)
    .executeTakeFirst();

  if (!apiary) {
    throw httpErrors.NotFound('Apiary not found or access denied');
  }

  // Get weather data using the apiary's coordinates
  // Convert string coordinates to numbers
  return await getWeatherData(
    Number(apiary.latitude),
    Number(apiary.longitude),
  );
}
