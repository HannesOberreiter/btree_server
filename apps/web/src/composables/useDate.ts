import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { useI18n } from 'vue-i18n';
import { computed, unref } from 'vue';

import 'dayjs/locale/de';
import 'dayjs/locale/en';
import { useAuthUserStore } from '~/stores/auth';

dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);

type DateFormat =
  | 'date'
  | 'date-time'
  | 'time'
  | 'date-time-seconds'
  | 'rearing';

export const useDateFormat = () => {
  const { locale } = useI18n();
  const storeUser = useAuthUserStore();

  const formats = computed(() => {
    const format = storeUser.getDateFormat;
    if (format === 'DD.MM.YYYY') {
      return {
        date: 'DD.MM.YYYY',
        'date-time': 'DD.MM.YYYY HH:mm',
        time: 'HH:mm',
        'date-time-seconds': 'DD.MM.YYYY HH:mm:ss',
        rearing: 'lll dddd',
      };
    }

    return {
      date: 'YYYY-MM-DD',
      'date-time': 'lll',
      time: 'LT',
      'date-time-seconds': 'L LTS',
      rearing: 'lll, dddd',
    };
  });

  const isoFormat = (
    date: string,
    type = 'date' as DateFormat,
    inputFormat = '',
  ) => {
    const formats = {
      date: 'YYYY-MM-DD',
      'date-time': 'YYYY-MM-DD HH:mm',
      time: 'HH:mm',
      'date-time-seconds': 'YYYY-MM-DD HH:mm:ss',
      rearing: 'lll dddd',
    };
    if (inputFormat !== '')
      return dayjs(date, inputFormat).format(formats[type]);
    return dayjs(date).format(formats[type]);
  };

  const displayFormat = (
    date: string,
    type = 'date' as DateFormat,
    inputFormat = '',
  ) => {
    if (inputFormat !== '')
      return dayjs(date, inputFormat).format(formats.value[type]);
    return dayjs(date).locale(unref(locale)).format(formats.value[type]);
  };

  const rearingFormat = (date: string) => {
    const prefix = displayFormat(date, 'date-time');
    const suffix = dayjs(date).locale(unref(locale)).format('dddd');
    return `${prefix} ${suffix}`;
  };

  const getYear = (date: string) => dayjs(date).year();
  const getCurrent = () => dayjs().toISOString();

  const toDayjs = (date: string | Date) => dayjs(date);
  const validateFormat = (date: string, format: string) =>
    dayjs(date, format, true).isValid();

  return {
    isoFormat,
    displayFormat,
    rearingFormat,
    getYear,
    getCurrent,
    toDayjs,
    validateFormat,
    formats,
  };
};
