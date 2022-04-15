import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import 'dayjs/locale/de';
import 'dayjs/locale/en';

dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);

type DateFormat = 'date' | 'date-time' | 'time' | 'date-time-seconds';

export const useDateFormat = () => {
  const { locale } = useI18n();

  const isoFormat = (
    date: string,
    type = 'date' as DateFormat,
    inputFormat = ''
  ) => {
    const formats = {
      date: 'YYYY-MM-DD',
      'date-time': 'YYY-MM-DD HH:mm',
      time: 'HH:mm',
      'date-time-seconds': 'YYY-MM-DD HH:mm:ss',
    };
    if (inputFormat !== '')
      return dayjs(date, inputFormat).format(formats[type]);
    return dayjs(date).format(formats[type]);
  };

  const displayFormat = (
    date: string,
    type = 'date' as DateFormat,
    inputFormat = ''
  ) => {
    const formats = {
      date: 'YYYY-MM-DD',
      'date-time': 'lll',
      time: 'LT',
      'date-time-seconds': 'L LTS',
    };
    if (inputFormat !== '')
      return dayjs(date, inputFormat).format(formats[type]);
    return dayjs(date).locale(unref(locale)).format(formats[type]);
  };

  const getYear = (date: string) => dayjs(date).year();
  const getCurrent = () => dayjs().toISOString();

  const toDayjs = (date: string | Date) => dayjs(date);
  const validateFormat = (date: string, format: string) =>
    dayjs(date, format, true).isValid();

  return {
    isoFormat,
    displayFormat,
    getYear,
    getCurrent,
    toDayjs,
    validateFormat,
  };
};
