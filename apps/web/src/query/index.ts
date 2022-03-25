import { api } from '~/boot/axios';
import { map } from 'lodash';
import { MaybeRef } from '@vueuse/core';
import { Option } from '~/types';
import { queryCache } from '~/boot/vue-query';
import { Ref } from 'vue';
import { useNotification } from '~/composables/useResponseText';
import { useQuery } from 'vue-query';

export function useOptionsQuery(table: Option) {
  return useQuery(['option', table], () => api.get(`/v1/option/${table}`), {
    select: (response) => response.data,
    onError: (error: any) => {
      useNotification().open('negative', error.response);
    },
  });
}

export function useQueensQuery(
  offset = 0 as MaybeRef<number>,
  limit = 20 as MaybeRef<number>,
  order = 'id' as MaybeRef<string>
) {
  return useQuery(
    ['queens', offset, limit, order],
    () => api.get(`/v1/queens?limit=${limit}&offset=${offset}&order=${order}`),
    {
      select: (response) => response.data,
      onError: (error: any) => {
        useNotification().open('negative', error.response);
      },
    }
  );
}

export function useApiariesQuery() {
  return useQuery(['apiaries'], () => api.get('/v1/apiary'), {
    placeholderData: { result: [], center: [47.4751336, 13.5968839, 2] } as any,
    select: (response) => {
      const result = map(response.data, (value) => {
        const hive_count = value.hive_count
          ? `(${value.hive_count.count + value.hive_count.grouphivescount})`
          : '';

        value.label = `${value.name} ${hive_count}`;
        value.value = value.id;
        return value;
      });
      const center =
        result.length > 0
          ? [result[0].latitude, result[0].longitude, 9]
          : [47.4751336, 13.5968839, 2];
      return {
        result: result,
        center: center,
      } as any;
    },
    onError: (error: any) => useNotification().open('negative', error.response),
  });
}

export function useTemperatureQuery(
  apiary_id: Ref<number>,
  { enabled = undefined as MaybeRef<boolean | undefined> }
) {
  return useQuery(
    ['temperature', apiary_id],
    () => api.get(`/v1/service/temperature/${apiary_id.value}`),
    {
      enabled,
      select: (response) => response.data,
      onError: (error: any) =>
        useNotification().open('negative', error.response),
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
    onError: (error: any) => useNotification().open('negative', error.response),
  });
}

export function useHivesQuery() {
  return useQuery(['hives'], () => api.get('/v1/hive'), {
    select: (response) => {
      const result = map(response.data, (value) => {
        value.label = `${value.hive_name} (${value.apiary_name})`;
        value.value = value.hive_id;
        return value;
      });
      return result ? result : ([] as any);
    },
    onError: (error: any) => useNotification().open('negative', error.response),
  });
}

export function clearCache() {
  queryCache.clear();
}
