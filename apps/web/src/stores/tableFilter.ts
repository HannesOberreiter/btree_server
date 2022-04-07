import { compact, isEmpty, isNil, map, omitBy } from 'lodash';
import { defineStore } from 'pinia';

interface State {
  hive: string;
  [key: string]: string;
}

export const useTableFilterStore = defineStore('tableFilter', {
  state: () =>
    ({
      hive: '',
      movedate: '',
    } as State),
  getters: {
    field: (state) => {
      return (table: string, key: string) => {
        try {
          const values = JSON.parse(state[table]);
          const fil = map(values, (o) => {
            if (key === 'date') return o[key];
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
          if (key === 'date') return { [key]: o };
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
