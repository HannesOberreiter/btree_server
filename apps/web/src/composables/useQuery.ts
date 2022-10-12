import { map, round } from 'lodash-es';
import { MaybeRef } from '@vueuse/core';
import { Option, Task } from '~/types';
import { queryCache } from '~/boot/vue-query';
import { Ref } from 'vue';
import { useNotification } from '~/composables/useNotification';
import { QueryClient, useQuery } from 'vue-query';
import dayjs from 'dayjs';
import { useApiFetch } from './useApi';

export function useCalendarQuery() {
  const client = new QueryClient({
    queryCache: queryCache,
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 1, // stale (refetching), after 1 minute
        cacheTime: 1000 * 60 * 60 * 48, // garbage collector, every 48 hours } },
      },
    },
  }); // need to use the queryclient here and not the useQuery as it wont work with full calendar
  const api = useApiFetch();
  function fetchQuery(source: string, start: Date, end: Date) {
    return client.fetchQuery(
      ['calendar', source, start, end],
      () => {
        const payload = {
          start: unref(start),
          end: unref(end),
        };
        return api.get(`/v1/calendar/${unref(source)}`, payload);
      },
      {}
    );
  }

  function invalidate(source: string) {
    const queries = source
      ? queryCache.findAll(['calendar', source])
      : queryCache.findAll(['calendar']);

    queries.forEach((query) => query.invalidate());
  }

  return { fetchQuery, invalidate };
}

export function useApiaryQuery({
  id = '0' as MaybeRef<string>,
  enabled = true as MaybeRef<boolean>,
}) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    ['apiary', id],
    () => {
      return api.get(`/v1/apiary/${unref(id)}`);
    },
    {
      enabled: enabled,
      keepPreviousData: true,
      select: (response) => {
        return response;
      },
      onError: (error: any) => notification.open('negative', error),
    }
  );
}

export function useTemperatureQuery(
  apiary_id: Ref<number>,
  { enabled = undefined as MaybeRef<boolean | undefined> }
) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    ['temperature', apiary_id],
    () => {
      return api.get(`/v1/service/temperature/${apiary_id.value}`);
    },
    {
      enabled,
      select: (response) => response,
      onError: (error: any) => notification.open('negative', error),
    }
  );
}

export function useMovementsQuery({
  offset = 0 as MaybeRef<number>,
  limit = 10000 as MaybeRef<number>,
  order = ['date'] as MaybeRef<Array<string>>,
  direction = ['asc'] as MaybeRef<Array<string>>,
  q = '' as MaybeRef<string>,
  filters = '' as MaybeRef<string>,
  enabled = true as MaybeRef<boolean>,
}) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    ['movedate', offset, limit, order, direction, q, filters],
    () => {
      const payload = {
        offset: unref(offset),
        limit: unref(limit),
        order: unref(order),
        direction: unref(direction),
        q: unref(q),
        filters: unref(filters),
      };
      return api.get('/v1/movedate', payload);
    },
    {
      enabled: enabled,
      keepPreviousData: true,
      select: (response) => response,
      onError: (error: any) => notification.open('negative', error),
    }
  );
}

export function useTodosQuery({
  offset = 0 as MaybeRef<number>,
  limit = 10000 as MaybeRef<number>,
  order = ['date'] as MaybeRef<Array<string>>,
  direction = ['asc'] as MaybeRef<Array<string>>,
  q = '' as MaybeRef<string>,
  filters = '' as MaybeRef<string>,
  enabled = true as MaybeRef<boolean>,
  done = true as MaybeRef<boolean>,
}) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    ['todo', offset, limit, order, direction, q, filters, done],
    () => {
      const payload = {
        offset: unref(offset),
        limit: unref(limit),
        order: unref(order),
        direction: unref(direction),
        q: unref(q),
        filters: unref(filters),
        done: unref(done),
      };
      return api.get('/v1/todo', payload);
    },
    {
      enabled: enabled,
      keepPreviousData: true,
      select: (response) => response,
      onError: (error: any) => notification.open('negative', error),
    }
  );
}

export function useTasksQuery(
  task: Task,
  {
    offset = 0 as MaybeRef<number>,
    limit = 10000 as MaybeRef<number>,
    order = ['date', 'done'] as MaybeRef<Array<string>>,
    direction = ['asc', 'asc'] as MaybeRef<Array<string>>,
    deleted = false as MaybeRef<boolean>,
    q = '' as MaybeRef<string>,
    enabled = true as MaybeRef<boolean>,
    details = false,
    filters = '' as MaybeRef<string>,
    done = true as MaybeRef<boolean>,
  }
) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    [task, offset, limit, order, direction, deleted, q, details, filters, done],
    () => {
      const payload = {
        offset: unref(offset),
        limit: unref(limit),
        order: unref(order),
        direction: unref(direction),
        deleted: unref(deleted),
        q: unref(q),
        details: unref(details),
        filters: unref(filters),
        done: unref(done),
      };
      return api.get(`/v1/${task}`, payload);
    },
    {
      enabled: enabled,
      keepPreviousData: true,
      select: (response) => response,
      onError: (error: any) => notification.open('negative', error),
    }
  );
}

export function useApiariesQuery({
  offset = 0 as MaybeRef<number>,
  limit = 10000 as MaybeRef<number>,
  order = ['name', 'modus'] as MaybeRef<Array<string>>,
  direction = ['asc', 'asc'] as MaybeRef<Array<string>>,
  modus = true as MaybeRef<boolean>,
  deleted = false as MaybeRef<boolean>,
  q = '' as MaybeRef<string>,
  enabled = true as MaybeRef<boolean>,
  details = false,
}) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    ['apiary', offset, limit, order, direction, modus, deleted, q, details],
    () => {
      const payload = {
        offset: unref(offset),
        limit: unref(limit),
        order: unref(order),
        direction: unref(direction),
        modus: unref(modus),
        deleted: unref(deleted),
        q: unref(q),
        details: unref(details),
      };
      return api.get('/v1/apiary', payload);
    },
    {
      enabled: enabled,
      keepPreviousData: true,
      select: (response) => {
        const result = map(response.results, (value) => {
          const hive_count = value.hive_count
            ? `(${value.hive_count.count + value.hive_count.grouphivescount})`
            : '';
          value.label = `${value.name} ${hive_count}`;
          value.value = value.id;
          value.type = 'apiary';
          return value;
        });
        const center =
          result.length > 0
            ? [result[0].latitude, result[0].longitude, 9]
            : [47.4751336, 13.5968839, 2];
        return result
          ? { results: result, total: response.total, center: center }
          : ([] as any);
      },
      onError: (error: any) => notification.open('negative', error),
    }
  );
}

export function useQueensQuery({
  offset = 0 as MaybeRef<number>,
  limit = 10000 as MaybeRef<number>,
  order = ['name', 'date'] as MaybeRef<Array<string>>,
  direction = ['asc', 'asc'] as MaybeRef<Array<string>>,
  modus = true as MaybeRef<boolean>,
  latest = null as MaybeRef<boolean>,
  deleted = false as MaybeRef<boolean>,
  filters = '' as MaybeRef<string>,
  q = '' as MaybeRef<string>,
  enabled = true as MaybeRef<boolean>,
  details = false,
}) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    [
      'queen',
      offset,
      limit,
      order,
      direction,
      modus,
      deleted,
      q,
      details,
      filters,
      latest,
    ],
    () => {
      const payload = {
        offset: unref(offset),
        limit: unref(limit),
        order: unref(order),
        direction: unref(direction),
        modus: unref(modus),
        deleted: unref(deleted),
        filters: unref(filters),
        q: unref(q),
        details: unref(details),
        latest: unref(latest),
      };
      return api.get('/v1/queen', payload);
    },
    {
      enabled: enabled,
      keepPreviousData: true,
      select: (response) => {
        const result = map(response.results, (value) => {
          value.label = `${value.name} (${dayjs(value.date).format(
            'YYYY-MM-DD'
          )})`;
          if (value.hive_location)
            value.label += ` [${value.hive_location.hive_name}]`;
          value.value = value.id;
          return value;
        });
        return result
          ? { results: result, total: response.total }
          : ([] as any);
      },
      onError: (error: any) => notification.open('negative', error),
    }
  );
}

export function useQueensStats({
  offset = 0 as MaybeRef<number>,
  limit = 10000 as MaybeRef<number>,
  order = ['move_date'] as MaybeRef<Array<string>>,
  direction = ['asc'] as MaybeRef<Array<string>>,
  filters = '' as MaybeRef<string>,
  q = '' as MaybeRef<string>,
  enabled = true as MaybeRef<boolean>,
}) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    ['queen_stats', offset, limit, order, direction, q, filters],
    () => {
      const payload = {
        offset: unref(offset),
        limit: unref(limit),
        order: unref(order),
        direction: unref(direction),
        filters: unref(filters),
        q: unref(q),
      };
      return api.get('/v1/queen/stats', payload);
    },
    {
      enabled: enabled,
      keepPreviousData: true,
      select: (response) => response,
      onError: (error: any) => notification.open('negative', error),
    }
  );
}

export function useQueenPedigree({
  id = 0 as MaybeRef<number>,
  enabled = true as MaybeRef<boolean>,
}) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    ['queen_pedigree', id],
    () => {
      return api.get(`/v1/queen/pedigree/${unref(id)}`);
    },
    {
      enabled: enabled,
      keepPreviousData: false,
      select: (response) => response,
      onError: (error: any) => notification.open('negative', error),
    }
  );
}

export function useChargeQuery({
  offset = 0 as MaybeRef<number>,
  limit = 10000 as MaybeRef<number>,
  order = ['id', 'bez'] as MaybeRef<Array<string>>,
  direction = ['asc', 'asc'] as MaybeRef<Array<string>>,
  deleted = false as MaybeRef<boolean>,
  filters = '' as MaybeRef<string>,
  q = '' as MaybeRef<string>,
  enabled = true as MaybeRef<boolean>,
}) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    ['charge', offset, limit, order, direction, deleted, q, filters],
    () => {
      const payload = {
        offset: unref(offset),
        limit: unref(limit),
        order: unref(order),
        direction: unref(direction),
        deleted: unref(deleted),
        filters: unref(filters),
        q: unref(q),
      };
      return api.get('/v1/charge', payload);
    },
    {
      enabled: enabled,
      keepPreviousData: true,
      select: (response) => response,
      onError: (error: any) => notification.open('negative', error),
    }
  );
}

export function useChargeStockQuery({
  offset = 0 as MaybeRef<number>,
  limit = 10000 as MaybeRef<number>,
  order = ['type_id'] as MaybeRef<Array<string>>,
  direction = ['asc'] as MaybeRef<Array<string>>,
  q = '' as MaybeRef<string>,
  enabled = true as MaybeRef<boolean>,
}) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    ['chargeStock', offset, limit, order, direction, q],
    () => {
      const payload = {
        offset: unref(offset),
        limit: unref(limit),
        order: unref(order),
        direction: unref(direction),
        q: unref(q),
      };
      return api.get('/v1/charge/stock', payload);
    },
    {
      enabled: enabled,
      keepPreviousData: true,
      select: (response) => response,
      onError: (error: any) => notification.open('negative', error),
    }
  );
}

export function useScaleQuery({ enabled = true as MaybeRef<boolean> }) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    ['scale'],
    () => {
      return api.get('/v1/scale');
    },
    {
      enabled: enabled,
      keepPreviousData: true,
      select: (response) => {
        const result = map(response, (value) => {
          const hive = value.hive ? ` (${value.hive.name})` : '';
          value.label = value.name + hive;
          value.value = value.id;
          return value;
        });
        return result ? { results: result } : ([] as any);
      },
      onError: (error: any) => notification.open('negative', error),
    }
  );
}

export function useScaleDataQuery({
  offset = 0 as MaybeRef<number>,
  limit = 10000 as MaybeRef<number>,
  order = ['id', 'bez'] as MaybeRef<Array<string>>,
  direction = ['asc', 'asc'] as MaybeRef<Array<string>>,
  filters = '' as MaybeRef<string>,
  q = '' as MaybeRef<string>,
  enabled = true as MaybeRef<boolean>,
}) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    ['scale_data', offset, limit, order, direction, q, filters],
    () => {
      const payload = {
        offset: unref(offset),
        limit: unref(limit),
        order: unref(order),
        direction: unref(direction),
        filters: unref(filters),
        q: unref(q),
      };
      return api.get('/v1/scale_data', payload);
    },
    {
      enabled: enabled,
      keepPreviousData: true,
      select: (response) => response,
      onError: (error: any) => notification.open('negative', error),
    }
  );
}

export function useHiveQuery({
  id = '0' as MaybeRef<string>,
  enabled = true as MaybeRef<boolean>,
}) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    ['hive', id],
    () => {
      return api.get(`/v1/hive/${unref(id)}`);
    },
    {
      enabled: enabled,
      keepPreviousData: true,
      select: (response) => {
        return response;
      },
      onError: (error: any) => notification.open('negative', error),
    }
  );
}

export function useHiveTaskQuery({
  id = '0' as MaybeRef<string>,
  year = dayjs().year() as MaybeRef<number>,
  apiary = true as MaybeRef<boolean>,
  enabled = true as MaybeRef<boolean>,
}) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    ['hive_task', id, year, apiary],
    () => {
      const payload = { year: unref(year), apiary: unref(apiary) };
      return api.get(`/v1/hive/task/${unref(id)}`, payload);
    },
    {
      enabled: enabled,
      keepPreviousData: true,
      select: (response) => {
        return response;
      },
      onError: (error: any) => notification.open('negative', error),
    }
  );
}

export function useHivesQuery({
  offset = 0 as MaybeRef<number>,
  limit = 10000 as MaybeRef<number>,
  order = [
    'modus',
    'hive_location.apiary_name',
    'position',
    'name',
  ] as MaybeRef<Array<string>>,
  direction = ['asc', 'asc', 'asc', 'asc'] as MaybeRef<Array<string>>,
  modus = true as MaybeRef<boolean>,
  deleted = false as MaybeRef<boolean>,
  q = '' as MaybeRef<string>,
  filters = '' as MaybeRef<string>,
  enabled = true as MaybeRef<boolean>,
  details = false,
}) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    [
      'hive',
      offset,
      limit,
      order,
      direction,
      modus,
      deleted,
      q,
      details,
      filters,
    ],
    () => {
      const payload = {
        offset: unref(offset),
        limit: unref(limit),
        order: unref(order),
        direction: unref(direction),
        modus: unref(modus),
        deleted: unref(deleted),
        q: unref(q),
        details: unref(details),
        filters: unref(filters),
      };
      return api.get('/v1/hive', payload);
    },
    {
      enabled: enabled,
      keepPreviousData: true,
      select: (response) => {
        const result = map(response.results, (value) => {
          value.label = `${value.name} (${value.hive_location.apiary_name})`;
          value.value = value.id;
          value.type = 'hive';
          return value;
        });
        return result
          ? { results: result, total: response.total }
          : ([] as any);
      },
      onError: (error: any) => notification.open('negative', error),
    }
  );
}

export function useOptionsQuery(
  table: MaybeRef<Option>,
  {
    order = ['favorite', 'name'] as MaybeRef<Array<string>>,
    direction = ['desc', 'asc'] as MaybeRef<Array<string>>,
    modus = true as MaybeRef<boolean>,
    enabled = true as MaybeRef<boolean>,
  }
) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    ['option', table, order, direction],
    () => {
      const payload = {
        order: unref(order),
        direction: unref(direction),
        modus: unref(modus),
      };
      return api.get(`/v1/option/${unref(table)}`, payload);
    },
    {
      enabled: enabled,
      select: (response) => {
        const result = map(response, (value) => {
          value.label = `${value.name}`;
          if (table === 'charge_types') {
            if (value.stock || value.unit) {
              value.label += ' (';
              if (value.stock) {
                value.label += `${round(value.stock.sum, 2)} `;
              }
              if (value.unit) {
                value.label += `${value.unit}`;
              }
              value.label = value.label.trim();
              value.label += ')';
            }
          }
          return value;
        });
        return result ? { results: result } : ([] as any);
      },
      onError: (error: any) => {
        notification.open('negative', error);
      },
    }
  );
}

export function useRearingDetailsQuery({
  offset = 0 as MaybeRef<number>,
  limit = 10000 as MaybeRef<number>,
  order = ['job'] as MaybeRef<Array<string>>,
  direction = ['asc'] as MaybeRef<Array<string>>,
  q = '' as MaybeRef<string>,
  enabled = true as MaybeRef<boolean>,
}) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    ['rearing_details', offset, limit, order, direction, q],
    () => {
      const payload = {
        offset: unref(offset),
        limit: unref(limit),
        order: unref(order),
        direction: unref(direction),
        q: unref(q),
      };
      return api.get('/v1/rearing_detail', payload);
    },
    {
      enabled: enabled,
      keepPreviousData: true,
      select: (response) => {
        const result = map(response.results, (value) => {
          value.label = `${value.job} [${value.hour}h]`;
          value.value = value.id;
          return value;
        });
        return result
          ? { results: result, total: response.total }
          : ([] as any);
      },
      onError: (error: any) => notification.open('negative', error),
    }
  );
}

export function useRearingTypesQuery({
  offset = 0 as MaybeRef<number>,
  limit = 10000 as MaybeRef<number>,
  order = ['name'] as MaybeRef<Array<string>>,
  direction = ['asc'] as MaybeRef<Array<string>>,
  q = '' as MaybeRef<string>,
  enabled = true as MaybeRef<boolean>,
}) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    ['rearing_types', offset, limit, order, direction, q],
    () => {
      const payload = {
        offset: unref(offset),
        limit: unref(limit),
        order: unref(order),
        direction: unref(direction),
        q: unref(q),
      };
      return api.get('/v1/rearing_type', payload);
    },
    {
      enabled: enabled,
      keepPreviousData: true,
      select: (response) => {
        const result = map(response.results, (value) => {
          value.label = value.name;
          value.value = value.id;
          return value;
        });
        return result
          ? { results: result, total: response.total }
          : ([] as any);
      },
      onError: (error: any) => notification.open('negative', error),
    }
  );
}

export function useRearingEventQuery({
  id = 0 as MaybeRef<number>,
  enabled = true as MaybeRef<boolean>,
}) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    ['rearingEvent', id],
    () => {
      const payload = {
        id: unref(id),
      };
      return api.get('/v1/calendar/rearing', payload);
    },
    {
      enabled: enabled,
      keepPreviousData: true,
      select: (response) => response,
      onError: (error: any) => notification.open('negative', error),
    }
  );
}

export function useRearingsQuery({
  offset = 0 as MaybeRef<number>,
  limit = 10000 as MaybeRef<number>,
  order = ['date'] as MaybeRef<Array<string>>,
  direction = ['asc'] as MaybeRef<Array<string>>,
  filters = '' as MaybeRef<string>,
  q = '' as MaybeRef<string>,
  enabled = true as MaybeRef<boolean>,
}) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    ['rearing', offset, limit, order, direction, q, filters],
    () => {
      const payload = {
        offset: unref(offset),
        limit: unref(limit),
        order: unref(order),
        direction: unref(direction),
        filters: unref(filters),
        q: unref(q),
      };
      return api.get('/v1/rearing', payload);
    },
    {
      enabled: enabled,
      keepPreviousData: true,
      select: (response) => response,
      onError: (error: any) => notification.open('negative', error),
    }
  );
}

export function useStatisticTable(
  kind: string,
  {
    offset = 0 as MaybeRef<number>,
    limit = 10000 as MaybeRef<number>,
    order = ['year', 'hive.name'] as MaybeRef<Array<string>>,
    direction = ['asc', 'asc'] as MaybeRef<Array<string>>,
    groupByType = false as MaybeRef<boolean>,
    filters = '' as MaybeRef<string>,
    q = '' as MaybeRef<string>,
    enabled = true as MaybeRef<boolean>,
  }
) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    [
      'statisticTable',
      kind,
      offset,
      limit,
      order,
      direction,
      q,
      filters,
      groupByType,
    ],
    () => {
      const payload = {
        offset: unref(offset),
        limit: unref(limit),
        order: unref(order),
        direction: unref(direction),
        filters: unref(filters),
        groupByType: unref(groupByType),
        q: unref(q),
      };
      return api.get(`/v1/statistic/${kind}/hive`, payload);
    },
    {
      enabled: enabled,
      keepPreviousData: true,
      select: (response) => response,
      onError: (error: any) => notification.open('negative', error),
    }
  );
}

export function useStatisticYear(
  kind: string,
  { filters = '' as MaybeRef<string>, enabled = true as MaybeRef<boolean> }
) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    ['statisticYear', kind, filters],
    () => {
      const payload = {
        filters: unref(filters),
      };
      return api.get(`/v1/statistic/${kind}/year`, payload);
    },
    {
      enabled: enabled,
      keepPreviousData: true,
      select: (response) => response,
      onError: (error: any) => notification.open('negative', error),
    }
  );
}

export function useStatisticApiary(
  kind: string,
  { filters = '' as MaybeRef<string>, enabled = true as MaybeRef<boolean> }
) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    ['statisticApiary', kind, filters],
    () => {
      const payload = {
        filters: unref(filters),
      };
      return api.get(`/v1/statistic/${kind}/apiary`, payload);
    },
    {
      enabled: enabled,
      keepPreviousData: true,
      select: (response) => response,
      onError: (error: any) => notification.open('negative', error),
    }
  );
}

export function useStatisticType(
  kind: string,
  { filters = '' as MaybeRef<string>, enabled = true as MaybeRef<boolean> }
) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    ['statisticType', kind, filters],
    () => {
      const payload = {
        filters: unref(filters),
      };
      return api.get(`/v1/statistic/${kind}/type`, payload);
    },
    {
      enabled: enabled,
      keepPreviousData: true,
      select: (response) => response,
      onError: (error: any) => notification.open('negative', error),
    }
  );
}

export function useCountsQuery({ enabled = true as MaybeRef<boolean> }) {
  const notification = useNotification();
  const api = useApiFetch();
  return useQuery(
    ['countsQuery'],
    () => {
      return api.get('/v1/company/count', '');
    },
    {
      enabled: enabled,
      keepPreviousData: true,
      refetchOnWindowFocus: true,
      staleTime: 1000, // stale (refetching), after 1 second
      select: (response) => response,
      onError: (error: any) => notification.open('negative', error),
    }
  );
}

export function clearCache(q = '') {
  if (q.trim() === '') queryCache.clear();
  else {
    const queries = queryCache.findAll(q);
    queries.forEach((query) => query.invalidate());
  }
}
