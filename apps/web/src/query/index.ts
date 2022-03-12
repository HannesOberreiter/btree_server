/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { useQuery } from 'vue-query';
import { api } from 'src/boot/axios';
import { useNotification } from '../composables/useResponseText';
import { queryCache } from 'src/boot/vue-query';
import { map } from 'lodash';
import { i18n } from 'src/boot/i18n';
import { MaybeRef } from '@vueuse/core';
import { Option } from 'src/types';
import { Ref } from 'vue';

const notification = useNotification();
const { t } = i18n.global;

export function useOptionsQuery(table: Option) {
  return useQuery(['option', table], () => api.get(`/v1/option/${table}`), {
    select: (response) => response.data,
    onError: (error: any) => notification.open('negative', error.response),
  });
}

export function useApiariesQuery() {
  return useQuery(['apiaries'], () => api.get('/v1/apiary'), {
    select: (response) => {
      const result = map(response.data, (value) => {
        const hive_count = value.hive_count
          ? `(${value.hive_count.count + value.hive_count.grouphivescount})`
          : '';

        value.label = `${value.name} ${hive_count}`;
        value.value = value.id;
        return value;
      });
      return result ? result : ([] as any);
    },
    onError: (error: any) => notification.open('negative', error.response),
  });
}

export function useTemperatureQuery(
  id: Ref<number>,
  { enabled = undefined as MaybeRef<boolean | undefined> }
) {
  return useQuery(
    ['temperature', id.value],
    () => api.get(`/v1/checkup/temperature/${id.value}`),
    {
      enabled,
      select: (response) => response.data,
      onError: (error: any) => notification.open('negative', error.response),
    }
  );
}

export function useApiaryQuery(
  id: number,
  { enabled = undefined as MaybeRef<boolean | undefined> }
) {
  return useQuery(['apiaries', id], () => api.get(`/v1/apiary/${id}`), {
    enabled,
    select: (response) => response.data,
    onError: (error: any) => notification.open('negative', error.response),
  });
}

export function useHivesQuery() {
  return useQuery(['hives'], () => api.get('/v1/hive'), {
    select: (response) => {
      const result = map(response.data, (value) => {
        const modus = value.hive_modus ? '' : t('inactive');
        value.label = `${value.hive_name} (${value.apiary_name}) ${modus}`;
        value.value = value.hive_id;
        return value;
      });
      return result ? result : ([] as any);
    },
    onError: (error: any) => notification.open('negative', error.response),
  });
}

export function clearCache() {
  queryCache.clear();
}
