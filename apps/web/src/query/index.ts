/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { useQuery } from 'vue-query';
import { api } from 'src/boot/axios';
import { useNotification } from '../composables/useResponseText';
import { queryCache } from 'src/boot/vue-query';
import { map } from 'lodash';
import { i18n } from 'src/boot/i18n';

const notification = useNotification();
const { t } = i18n.global;

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
    onError: (error) => notification.open('negative', error),
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
    onError: (error) => notification.open('negative', error),
  });
}

export function clearCache() {
  queryCache.clear();
}
