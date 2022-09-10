import { meteoblueKey } from '@/config/environment.config';
import { serverUnavailable } from '@hapi/boom';
import axios from 'axios';

export const getTemperature = async (latitude: number, longitude: number) => {
  // Api Key is given by meteoblue, we pay for it yearly, with limited amount of usage. (60,00 €/ 30 Mio Fetches)
  // https://www.meteoblue.com/en/weather-api
  const url = `https://my.meteoblue.com/packages/current?apikey=${meteoblueKey}&lat=${latitude}&lon=${longitude}&format=json`;
  try {
    return await axios.get(url);
  } catch (e) {
    console.error(e);
    throw serverUnavailable('Meteoblue error');
  }
};
