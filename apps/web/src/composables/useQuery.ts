import { api } from '~/boot/axios';
import { map } from 'lodash';
import { MaybeRef } from '@vueuse/core';
import { Option } from '~/types';
import { queryCache } from '~/boot/vue-query';
import { Ref } from 'vue';
import { useNotification } from '~/composables/useResponseText';
import { useQuery } from 'vue-query';
import { stringify } from 'query-string';

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

export function useHivesQuery({
  offset = 0 as MaybeRef<number>,
  limit = 10000 as MaybeRef<number>,
  order = ['name', 'modus'] as MaybeRef<Array<string>>,
  direction = ['asc', 'asc'] as MaybeRef<Array<string>>,
  modus = true as MaybeRef<boolean>,
  deleted = false as MaybeRef<boolean>,
  q = '' as MaybeRef<string>,
  enabled = true as MaybeRef<boolean>,
}) {
  return useQuery(
    ['hives', offset, limit, order, direction, modus, deleted, q],
    () => {
      let url = `/v1/hive?offset=${unref(offset)}`;
      url += `&limit=${unref(limit)}`;
      url += `&${stringify(
        { order: unref(order) },
        { arrayFormat: 'bracket' }
      )}`;
      url += `&${stringify(
        { direction: unref(direction) },
        {
          arrayFormat: 'bracket',
        }
      )}`;
      url += `&modus=${unref(modus)}&deleted=${unref(deleted)}`;
      url += `&q=${unref(q)}`;
      return api.get(url);
    },

    {
      enabled: enabled,
      keepPreviousData: true,
      select: (response) => {
        const result = map(response.data.results, (value) => {
          value.label = `${value.name} (${value.hive_location.apiary_name})`;
          value.value = value.id;
          return value;
        });
        return result
          ? { results: result, total: response.data.total }
          : ([] as any);
      },
      onError: (error: any) =>
        useNotification().open('negative', error.response),
    }
  );
}

export function clearCache() {
  queryCache.clear();
}
