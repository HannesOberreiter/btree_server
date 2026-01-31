import httpErrors from 'http-errors';

import { openweatherKey } from '../../config/environment.config.js';
import { Logger } from '../../services/logger.service.js';

interface TemperatureResponse {
  coord: {
    lon: number
    lat: number
  }
  weather: Array<{
    id: number
    main: string
    description: string
    icon: string
  }>
  base: string
  main: {
    temp: number
    feels_like: number
    temp_min: number
    temp_max: number
    pressure: number
    humidity: number
    sea_level: number
    grnd_level: number
  }
  visibility: number
  wind: {

    speed: number
    deg: number
  }
  clouds: {
    all: number
  }
  dt: number
  sys: {
    type: number
    id: number
    country: string
    sunrise: number
    sunset: number
  }
  timezone: number
  id: number
  name: string
  cod: number
}

/**
 * Get current weather temperature for a location using OpenWeather API
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @returns Current weather data
 */
export async function getTemperature(latitude: number, longitude: number) {
  // OpenWeather Current Weather API - Free tier: 60 calls/min, 1M calls/month
  // https://openweathermap.org/current
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${openweatherKey}`;

  try {
    const response = await fetch(url);
    const result = await response.json();
    if (result.cod && result.cod !== 200) {
      throw httpErrors.BadRequest(result.message || 'OpenWeather error');
    }
    return result as TemperatureResponse;
  }
  catch (error) {
    Logger.getInstance().log('error', 'OpenWeather error', {
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
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_mean&timezone=auto`;

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
