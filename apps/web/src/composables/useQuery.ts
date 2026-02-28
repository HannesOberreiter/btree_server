import type { ComputedRef, MaybeRef, Ref } from 'vue';
import type { Option, Task, TodoPaginatedResponse } from '../types';
import {
	keepPreviousData,
	QueryClient,
	useQuery,
	useQueryClient,
} from '@tanstack/vue-query';
import dayjs from 'dayjs';
import { map, round } from 'lodash-es';
import { unref } from 'vue';
import { queryCache } from '../boot/vue-query';
import { useApiFetch } from './useApi';

export function useCalendarQuery() {
	const client = new QueryClient({
		queryCache,
		defaultOptions: {
			queries: {
				refetchOnWindowFocus: false,
				refetchOnMount: true,
				staleTime: 1000 * 60 * 1, // stale (refetching), after 1 minute
				gcTime: 1000 * 60 * 60 * 48, // garbage collector, every 48 hours } },
			},
		},
	}); // need to use the queryclient here and not the useQuery as it wont work with full calendar
	const api = useApiFetch();
	function fetchQuery(source: string, start: Date, end: Date) {
		return client.fetchQuery({
			queryKey: ['calendar', source, start, end],
			queryFn: () => {
				const payload = {
					start: unref(start),
					end: unref(end),
				};
				return api.get(`/v1/calendar/${unref(source)}`, payload);
			},
		});
	}

	function invalidate(source: string) {
		const queries = source
			? queryCache.findAll({ queryKey: ['calendar', source] })
			: queryCache.findAll({ queryKey: ['calendar'] });

		queries.forEach(query => query.invalidate());
	}

	return { fetchQuery, invalidate };
}

export function useApiaryQuery({
	id = '0' as MaybeRef<string>,
	enabled = true as MaybeRef<boolean>,
}) {
	const api = useApiFetch();
	return useQuery({
		queryKey: ['apiary', id],
		queryFn: () => {
			return api.get(`/v1/apiary/${unref(id)}`);
		},
		enabled,
		placeholderData: keepPreviousData,
		select: (response) => {
			return response;
		},
	});
}

/* OpenWeatherMap API response structure */
interface TemperatureResponse {
	coord: {
		lon: number;
		lat: number;
	};
	weather: Array<{
		id: number;
		main: string;
		description: string;
		icon: string;
	}>;
	base: string;
	main: {
		temp: number;
		feels_like: number;
		temp_min: number;
		temp_max: number;
		pressure: number;
		humidity: number;
		sea_level: number;
		grnd_level: number;
	};
	visibility: number;
	wind: {

		speed: number;
		deg: number;
	};
	clouds: {
		all: number;
	};
	dt: number;
	sys: {
		type: number;
		id: number;
		country: string;
		sunrise: number;
		sunset: number;
	};
	timezone: number;
	id: number;
	name: string;
	cod: number;
}

export function useTemperatureQuery(
	apiary_id: Ref<number>,
	{ enabled = true as MaybeRef<boolean> },
) {
	const api = useApiFetch();
	return useQuery({
		queryKey: ['temperature', apiary_id],
		queryFn: () => {
			return api.get(`/v1/service/temperature/${apiary_id.value}`);
		},
		enabled,
		select: response => response as TemperatureResponse,
	});
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
	const api = useApiFetch();
	return useQuery({
		queryKey: ['movedate', offset, limit, order, direction, q, filters],
		queryFn: () => {
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
		enabled,
		placeholderData: keepPreviousData,
		select: response => response,
	});
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
	const api = useApiFetch();
	return useQuery({
		queryKey: ['todo', offset, limit, order, direction, q, filters, done],
		queryFn: () => {
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
		enabled,
		placeholderData: keepPreviousData,
		select: response => response as TodoPaginatedResponse,
	});
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
		filters = '' as MaybeRef<string> | ComputedRef<string | undefined>,
		done = true as MaybeRef<boolean | null> | null,
	},
) {
	const api = useApiFetch();

	return useQuery({
		queryKey: [
			task,
			offset,
			limit,
			order,
			direction,
			deleted,
			q,
			details,
			filters,
			done,
		],
		queryFn: () => {
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
		enabled,
		placeholderData: keepPreviousData,
		select: response => response,
	});
}

export function useApiariesQuery({
	offset = 0 as MaybeRef<number>,
	limit = 10000 as MaybeRef<number>,
	order = ['name', 'modus'] as MaybeRef<Array<string>>,
	direction = ['asc', 'asc'] as MaybeRef<Array<string>>,
	modus = true as MaybeRef<boolean> | null,
	deleted = false as MaybeRef<boolean>,
	q = '' as MaybeRef<string>,
	enabled = true as MaybeRef<boolean>,
	details = false,
}) {
	const api = useApiFetch();
	return useQuery({
		queryKey: [
			'apiary',
			offset,
			limit,
			order,
			direction,
			modus,
			deleted,
			q,
			details,
		],
		queryFn: () => {
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
		enabled,
		placeholderData: keepPreviousData,
		refetchOnMount: true,
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
			const center
				= result.length > 0
					? [result[0].latitude, result[0].longitude, 9]
					: [47.4751336, 13.5968839, 2];
			return result
				? { results: result, total: response.total, center }
				: ([] as any);
		},
	});
}

export function useQueensQuery({
	offset = 0 as MaybeRef<number>,
	limit = 10000 as MaybeRef<number>,
	order = ['name', 'date'] as MaybeRef<Array<string>>,
	direction = ['asc', 'asc'] as MaybeRef<Array<string>>,
	modus = true as MaybeRef<boolean | null>,
	latest = null as MaybeRef<boolean | null>,
	deleted = false as MaybeRef<boolean>,
	filters = '' as MaybeRef<string>,
	q = '' as MaybeRef<string>,
	enabled = true as MaybeRef<boolean>,
	details = false,
}) {
	const api = useApiFetch();
	return useQuery({
		queryKey: [
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
		queryFn: () => {
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
		enabled,
		placeholderData: keepPreviousData,
		select: (response) => {
			const result = map(response.results, (value) => {
				value.label = `${value.name} (${dayjs(value.date).format(
					'YYYY-MM-DD',
				)})`;
				if (value.hive_location)
					value.label += ` [${value.hive_location.hive_name}]`;
				value.value = value.id;
				return value;
			});
			return result ? { results: result, total: response.total } : ([] as any);
		},
	});
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
	const api = useApiFetch();
	return useQuery({
		queryKey: ['queen_stats', offset, limit, order, direction, q, filters],
		queryFn: () => {
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
		enabled,
		placeholderData: keepPreviousData,
		select: response => response,
	});
}

export function useQueenPedigree({
	id = 0 as MaybeRef<number>,
	enabled = true as MaybeRef<boolean>,
}) {
	const api = useApiFetch();
	return useQuery({
		queryKey: ['queen_pedigree', id],
		queryFn: () => {
			return api.get(`/v1/queen/pedigree/${unref(id)}`);
		},
		enabled,
		placeholderData: keepPreviousData,
		select: response => response,
	});
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
	const api = useApiFetch();
	return useQuery({
		queryKey: ['charge', offset, limit, order, direction, deleted, q, filters],
		queryFn: () => {
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
		enabled,
		placeholderData: keepPreviousData,
		select: response => response,
	});
}

export function useChargeStockQuery({
	offset = 0 as MaybeRef<number>,
	limit = 10000 as MaybeRef<number>,
	order = ['type_id'] as MaybeRef<Array<string>>,
	direction = ['asc'] as MaybeRef<Array<string>>,
	q = '' as MaybeRef<string>,
	enabled = true as MaybeRef<boolean>,
}) {
	const api = useApiFetch();
	return useQuery({
		queryKey: ['chargeStock', offset, limit, order, direction, q],
		queryFn: () => {
			const payload = {
				offset: unref(offset),
				limit: unref(limit),
				order: unref(order),
				direction: unref(direction),
				q: unref(q),
			};
			return api.get('/v1/charge/stock', payload);
		},
		enabled,
		placeholderData: keepPreviousData,
		select: response => response,
	});
}

export function useScaleQuery({ enabled = true as MaybeRef<boolean> }) {
	const api = useApiFetch();
	return useQuery({
		queryKey: ['scale'],
		queryFn: () => {
			return api.get('/v1/scale');
		},
		enabled,
		placeholderData: keepPreviousData,
		select: (response) => {
			const result = map(response, (value) => {
				const hive = value.hive ? ` (${value.hive.name})` : '';
				value.label = value.name + hive;
				value.value = value.id;
				return value;
			});
			return result ? { results: result } : ([] as any);
		},
	});
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
	const api = useApiFetch();
	return useQuery({
		queryKey: ['scale_data', offset, limit, order, direction, q, filters],
		queryFn: () => {
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
		enabled,
		placeholderData: keepPreviousData,
		select: response => response,
	});
}

export function useHiveQuery({
	id = '0' as MaybeRef<string>,
	enabled = true as MaybeRef<boolean>,
}) {
	const api = useApiFetch();
	return useQuery({
		queryKey: ['hive', id],
		queryFn: () => {
			return api.get(`/v1/hive/${unref(id)}`);
		},
		enabled,
		placeholderData: keepPreviousData,
		select: (response) => {
			return response;
		},
	});
}

export function useHiveTaskQuery({
	id = '0' as MaybeRef<string>,
	year = dayjs().year() as MaybeRef<number>,
	apiary = true as MaybeRef<boolean>,
	enabled = true as MaybeRef<boolean>,
}) {
	const api = useApiFetch();
	return useQuery({
		queryKey: ['hive_task', id, year, apiary],
		queryFn: () => {
			const payload = { year: unref(year), apiary: unref(apiary) };
			return api.get(`/v1/hive/task/${unref(id)}`, payload);
		},
		enabled,
		placeholderData: keepPreviousData,
		select: (response) => {
			return response;
		},
	});
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
	modus = true as MaybeRef<boolean> | null,
	deleted = false as MaybeRef<boolean>,
	q = '' as MaybeRef<string>,
	filters = '' as MaybeRef<string>,
	enabled = true as MaybeRef<boolean>,
	details = false,
}) {
	const api = useApiFetch();
	return useQuery({
		queryKey: [
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
		queryFn: () => {
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
		enabled,
		placeholderData: keepPreviousData,
		select: (response) => {
			const result = map(response.results, (value) => {
				const apiary = `${value.hive_location?.apiary_name ?? '--'}`;
				value.label = `${value.name} (${apiary})`;
				value.value = value.id;
				value.type = 'hive';
				return value;
			});
			return result ? { results: result, total: response.total } : ([] as any);
		},
	});
}

export function useOptionsQuery(
	table: MaybeRef<Option>,
	{
		order = ['favorite', 'name'] as MaybeRef<Array<string>>,
		direction = ['desc', 'asc'] as MaybeRef<Array<string>>,
		modus = true as MaybeRef<boolean> | null,
		enabled = true as MaybeRef<boolean>,
	},
) {
	const api = useApiFetch();
	return useQuery({
		queryKey: ['option', table, order, direction],
		queryFn: () => {
			const payload = {
				order: unref(order),
				direction: unref(direction),
				modus: unref(modus),
			};
			return api.get(`/v1/option/${unref(table)}`, payload);
		},
		enabled,
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
	});
}

export function useRearingDetailsQuery({
	offset = 0 as MaybeRef<number>,
	limit = 10000 as MaybeRef<number>,
	order = ['job'] as MaybeRef<Array<string>>,
	direction = ['asc'] as MaybeRef<Array<string>>,
	q = '' as MaybeRef<string>,
	enabled = true as MaybeRef<boolean>,
}) {
	const api = useApiFetch();
	return useQuery({
		queryKey: ['rearing_details', offset, limit, order, direction, q],
		queryFn: () => {
			const payload = {
				offset: unref(offset),
				limit: unref(limit),
				order: unref(order),
				direction: unref(direction),
				q: unref(q),
			};
			return api.get('/v1/rearing_detail', payload);
		},
		enabled,
		placeholderData: keepPreviousData,
		select: (response) => {
			const result = map(response.results, (value) => {
				value.label = `${value.job}`;
				value.value = value.id;
				return value;
			});
			return result ? { results: result, total: response.total } : ([] as any);
		},
	});
}

export function useRearingTypesQuery({
	offset = 0 as MaybeRef<number>,
	limit = 10000 as MaybeRef<number>,
	order = ['name'] as MaybeRef<Array<string>>,
	direction = ['asc'] as MaybeRef<Array<string>>,
	q = '' as MaybeRef<string>,
	enabled = true as MaybeRef<boolean>,
}) {
	const api = useApiFetch();
	return useQuery({
		queryKey: ['rearing_types', offset, limit, order, direction, q],
		queryFn: () => {
			const payload = {
				offset: unref(offset),
				limit: unref(limit),
				order: unref(order),
				direction: unref(direction),
				q: unref(q),
			};
			return api.get('/v1/rearing_type', payload);
		},
		enabled,
		placeholderData: keepPreviousData,
		select: (response) => {
			const result = map(response.results, (value) => {
				value.label = value.name;
				value.value = value.id;
				return value;
			});
			return result ? { results: result, total: response.total } : ([] as any);
		},
	});
}

export function useRearingEventQuery({
	id = 0 as MaybeRef<number>,
	enabled = true as MaybeRef<boolean>,
}) {
	const api = useApiFetch();
	return useQuery({
		queryKey: ['rearingEvent', id],
		queryFn: () => {
			const payload = {
				id: unref(id),
			};
			return api.get('/v1/calendar/rearing', payload);
		},
		enabled,
		placeholderData: keepPreviousData,
		select: response => response,
	});
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
	const api = useApiFetch();
	return useQuery({
		queryKey: ['rearing', offset, limit, order, direction, q, filters],
		queryFn: () => {
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
		enabled,
		placeholderData: keepPreviousData,
		select: response => response,
	});
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
	},
) {
	const api = useApiFetch();
	return useQuery({
		queryKey: [
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
		queryFn: () => {
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
		enabled,
		placeholderData: keepPreviousData,
		select: response => response,
	});
}

export function useStatisticYear(
	kind: string,
	{ filters = '' as MaybeRef<string>, enabled = true as MaybeRef<boolean> },
) {
	const api = useApiFetch();
	return useQuery({
		queryKey: ['statisticYear', kind, filters],
		queryFn: () => {
			const payload = {
				filters: unref(filters),
			};
			return api.get(`/v1/statistic/${kind}/year`, payload);
		},
		enabled,
		placeholderData: keepPreviousData,
		select: response => response,
	});
}

export function useStatisticApiary(
	kind: string,
	{ filters = '' as MaybeRef<string>, enabled = true as MaybeRef<boolean> },
) {
	const api = useApiFetch();
	return useQuery({
		queryKey: ['statisticApiary', kind, filters],
		queryFn: () => {
			const payload = {
				filters: unref(filters),
			};
			return api.get(`/v1/statistic/${kind}/apiary`, payload);
		},
		enabled,
		placeholderData: keepPreviousData,
		select: response => response,
	});
}

export function useStatisticType(
	kind: string,
	{ filters = '' as MaybeRef<string>, enabled = true as MaybeRef<boolean> },
) {
	const api = useApiFetch();
	return useQuery({
		queryKey: ['statisticType', kind, filters],
		queryFn: () => {
			const payload = {
				filters: unref(filters),
			};
			return api.get(`/v1/statistic/${kind}/type`, payload);
		},
		enabled,
		placeholderData: keepPreviousData,
		select: response => response,
	});
}

export function useCountsQuery({ enabled = true as MaybeRef<boolean> }) {
	const api = useApiFetch();
	return useQuery({
		queryKey: ['countsQuery'],
		queryFn: () => {
			return api.get('/v1/company/count', '', false);
		},
		enabled,
		placeholderData: keepPreviousData,
		refetchOnWindowFocus: false,
		refetchOnMount: true,
		staleTime: 1000 * 60, // after 60 second
		refetchInterval: 1000 * 60 * 30, // every 30 minutes
		select: response => response,
	});
}

export function clearCache(q = '') {
	if (q.trim() === '') {
		queryCache.clear();
	}
	else {
		const queries = queryCache.findAll({ queryKey: [q] });
		queries.forEach(query => query.invalidate());
	}
}

export function useInvalidateQueries() {
	const queryClient = useQueryClient();

	function invalidate(q = '') {
		if (q.trim() === '') {
			queryClient.invalidateQueries();
		}
		else {
			queryClient.invalidateQueries({ queryKey: [q] });
		}
	}
	return { invalidate };
}

export function useAfbQuery({
	enabled = true as MaybeRef<boolean>,
}) {
	const api = useApiFetch();
	return useQuery({
		queryKey: ['map', 'afb'],
		queryFn: () => {
			return api.get('/v1/service/map/american_foulbrood');
		},
		enabled,
		refetchOnMount: true,
		staleTime: 1000 * 60 * 30,
	});
}
