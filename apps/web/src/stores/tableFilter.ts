import { compact, isEmpty, isNil, map, omitBy } from 'lodash-es';
import { defineStore } from 'pinia';

interface State {
  hive: string;
  queen: string;
  movedate: string;
  todo: string;
  feed: string;
  harvest: string;
  treatment: string;
  checkup: string;
  charge: string;
  scale_data: string;
  rearing: string;
  [key: string]: string;
}

export const useTableFilterStore = defineStore('tableFilter', {
  state: () =>
    ({
      hive: '',
      movedate: '',
      todo: '',
      feed: '',
      harvest: '',
      treatment: '',
      checkup: '',
      queen: '',
      charge: '',
      scale_data: '',
      rearing: '',
    } as State),
  getters: {
    field: (state) => {
      return (table: string, key: string) => {
        try {
          const values = JSON.parse(state[table]);
          const fil = map(values, (o) => {
            if (key === 'date' || key === 'queens.date') return o[key];
            if (key in o) return o[key];
            return null;
          });
          const clean = omitBy(fil, isNil);
          return clean[0];
        } catch (e) {
          return null;
        }
      };
    },
    table: (state) => {
      return (table: string) => {
        return state[table];
      };
    },
  },
  actions: {
    update(table: string, payload: any) {
      if (payload) {
        const array = map(payload, (o, key) => {
          if (!o) return null;
          if (key === 'date' || key === 'queens.date') return { [key]: o };
          if ('id' in o) return { [key]: o.id };
        });
        const clean = compact(array);
        if (isEmpty(clean)) {
          this.reset(table);
        } else {
          try {
            const values = JSON.stringify(clean);
            this[table] = values;
          } catch (e) {
            this.reset(table);
          }
        }
      } else {
        this.reset(table);
      }
    },
    reset(table: string) {
      this[table] = '';
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTableFilterStore, import.meta.hot));
}
