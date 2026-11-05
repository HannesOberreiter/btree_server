import type { ApiaryForecast } from '../schemas/service.schema.js';
import type { OneCallResponse } from './weather.adapter.js';

/** Bees fly at or above this air temperature (°C). */
export const FLIGHT_MIN_TEMPERATURE = 12;
/** Bees fly below this precipitation probability (%). */
export const FLIGHT_MAX_PRECIPITATION_PROBABILITY = 30;
/** Bees fly below this wind speed (km/h). */
export const FLIGHT_MAX_WIND_SPEED = 20;
/** Frost warning when the daily minimum is below this temperature (°C). */
export const FROST_TEMPERATURE = 0;
/** Heat warning when the daily maximum is above this temperature (°C). */
export const HEAT_TEMPERATURE = 30;

type Daily = OneCallResponse['daily'][number];

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function toKmh(metersPerSecond: number) {
  return Math.round(metersPerSecond * 3.6);
}

/** Local time of the location as `YYYY-MM-DDTHH:mm`, without offset. */
function localTime(dt: number, offset: number) {
  return new Date((dt + offset) * 1000).toISOString().slice(0, 16);
}

function localDate(dt: number, offset: number) {
  return localTime(dt, offset).slice(0, 10);
}

function precipitation(entry: {
  rain?: { '1h': number } | number;
  snow?: { '1h': number } | number;
}) {
  const amount = (value?: { '1h': number } | number) =>
    typeof value === 'number' ? value : (value?.['1h'] ?? 0);
  return round1(amount(entry.rain) + amount(entry.snow));
}

function isFlightWeather(
  temperature: number,
  precipitationProbability: number,
  windSpeed: number,
) {
  return (
    temperature >= FLIGHT_MIN_TEMPERATURE &&
    precipitationProbability < FLIGHT_MAX_PRECIPITATION_PROBABILITY &&
    windSpeed < FLIGHT_MAX_WIND_SPEED
  );
}

function isDaylight(dt: number, day?: Pick<Daily, 'sunrise' | 'sunset'>) {
  return day !== undefined && dt >= day.sunrise && dt < day.sunset;
}

/**
 * Convert an OpenWeather One Call response into a forecast with beekeeping
 * signals. Units are °C, km/h, mm, and %. Times are local to the location.
 */
export function buildApiaryForecast(weather: OneCallResponse): ApiaryForecast {
  const offset = weather.timezone_offset;
  const dailyByDate = new Map(
    weather.daily.map((day) => [localDate(day.dt, offset), day]),
  );

  const hourly = weather.hourly.map((hour) => {
    const date = localDate(hour.dt, offset);
    const windSpeed = toKmh(hour.wind_speed);
    const precipitationProbability = Math.round(hour.pop * 100);
    const isDay = isDaylight(hour.dt, dailyByDate.get(date));
    return {
      time: localTime(hour.dt, offset),
      temperature: round1(hour.temp),
      precipitation: precipitation(hour),
      precipitation_probability: precipitationProbability,
      wind_speed: windSpeed,
      condition: hour.weather[0]?.id ?? 0,
      is_day: isDay,
      flight:
        isDay &&
        isFlightWeather(hour.temp, precipitationProbability, windSpeed),
    };
  });

  const current = weather.current;
  const currentWindSpeed = toKmh(current.wind_speed);
  const currentIsDay = isDaylight(current.dt, current);

  return {
    timezone: weather.timezone,
    thresholds: {
      flight_min_temperature: FLIGHT_MIN_TEMPERATURE,
      flight_max_precipitation_probability:
        FLIGHT_MAX_PRECIPITATION_PROBABILITY,
      flight_max_wind_speed: FLIGHT_MAX_WIND_SPEED,
      frost_temperature: FROST_TEMPERATURE,
      heat_temperature: HEAT_TEMPERATURE,
    },
    current: {
      time: localTime(current.dt, offset),
      temperature: round1(current.temp),
      feels_like: round1(current.feels_like),
      humidity: current.humidity,
      wind_speed: currentWindSpeed,
      wind_gust:
        current.wind_gust === undefined ? null : toKmh(current.wind_gust),
      precipitation: precipitation(current),
      condition: current.weather[0]?.id ?? 0,
      is_day: currentIsDay,
      flight:
        currentIsDay &&
        isFlightWeather(
          current.temp,
          hourly[0]?.precipitation_probability ?? 0,
          currentWindSpeed,
        ),
    },
    hourly,
    daily: weather.daily.map((day) => {
      const date = localDate(day.dt, offset);
      const windSpeed = toKmh(day.wind_speed);
      const precipitationProbability = Math.round(day.pop * 100);
      const hours = hourly.filter((hour) => hour.time.startsWith(date));
      // Count flight hours only when the hourly data covers the rest of the day.
      const coversDayEnd = hours.some((hour) => hour.time.endsWith('T23:00'));
      return {
        date,
        temperature_min: round1(day.temp.min),
        temperature_max: round1(day.temp.max),
        precipitation: precipitation(day),
        precipitation_probability: precipitationProbability,
        wind_speed: windSpeed,
        condition: day.weather[0]?.id ?? 0,
        sunrise: localTime(day.sunrise, offset),
        sunset: localTime(day.sunset, offset),
        flight_day: isFlightWeather(
          day.temp.max,
          precipitationProbability,
          windSpeed,
        ),
        flight_hours: coversDayEnd
          ? hours.filter((hour) => hour.flight).length
          : null,
        frost: day.temp.min < FROST_TEMPERATURE,
        heat: day.temp.max > HEAT_TEMPERATURE,
      };
    }),
    alerts: (weather.alerts ?? []).map((alert) => ({
      sender: alert.sender_name,
      event: alert.event,
      start: localTime(alert.start, offset),
      end: localTime(alert.end, offset),
      description: alert.description,
    })),
  };
}
