import httpErrors from 'http-errors';

import { meteoblueKey } from '../../config/environment.config.js';
import { Logger } from '../../services/logger.service.js';

export async function getTemperature(latitude: number, longitude: number) {
  // Api Key is given by meteoblue, we pay for it yearly, with limited amount of usage. (60,00 €/ 30 Mio Fetches)
  // https://www.meteoblue.com/en/weather-api
  const url = `https://my.meteoblue.com/packages/current?apikey=${meteoblueKey}&lat=${latitude}&lon=${longitude}&format=json`;

  try {
    const response = await fetch(url);
    const result = await response.json();
    if (result.error) {
      throw httpErrors.BadRequest(result.error);
    }
    return result;
  }
  catch (error) {
    Logger.getInstance().log('error', 'Meteoblue error', {
      label: 'Meteoblue',
      error,
    });
    throw httpErrors.ServiceUnavailable('Meteoblue error');
  }
}
