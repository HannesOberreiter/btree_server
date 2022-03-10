import { useQuery } from 'vue-query';
import { api } from 'src/boot/axios';
import { useNotification } from '../composables/useResponseText';
import { queryCache } from 'src/boot/vue-query';
const notification = useNotification();

export function useApiariesQuery() {
  return useQuery(['apiaries'], () => api.get('/v1/apiary'), {
    select: (apiaries) => apiaries.data,
    onError: (error) => notification.open('negative', error),
  });
}

export function useCalendarQuery(
  source: string,
  fetchInfo: any,
  successCallback: any,
  failureCallback: any
) {
  const queryKey = ['calendar', source, fetchInfo.value];
  return useQuery(
    queryKey,
    () => api.get(`/v1/calendar/${source}`, { params: fetchInfo.value }),
    {
      select: (response) => successCallback(response.data),
      onError: (error) => {
        failureCallback(error);
        notification.open('negative', error);
      },
    }
  );
}

export function clearCache() {
  queryCache.clear();
}
