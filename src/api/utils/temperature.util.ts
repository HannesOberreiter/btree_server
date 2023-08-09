import { meteoblueKey } from '@/config/environment.config.js';
import httpErrors from 'http-errors';
import { Logger } from '../services/logger.service.js';

export const getTemperature = async (latitude: number, longitude: number) => {
  // Api Key is given by meteoblue, we pay for it yearly, with limited amount of usage. (60,00 €/ 30 Mio Fetches)
  // https://www.meteoblue.com/en/weather-api
  const url = `https://my.meteoblue.com/packages/current?apikey=${meteoblueKey}&lat=${latitude}&lon=${longitude}&format=json`;

  try {
    const response = await fetch(url);
    return response.json();
  } catch (error) {
    Logger.getInstance().log('error', 'Meteoblue error', {
      label: 'Meteoblue',
      error: error,
    });
    throw httpErrors.ServiceUnavailable('Meteoblue error');
  }
};
