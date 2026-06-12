import { compact, isArray, isEmpty, map } from 'lodash-es';
import { defineStore } from 'pinia';
import { deepUnref } from '../helpers/deep-unref';

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
  statistic_harvest: string;
  statistic_harvest_table: string;
  statistic_feed: string;
  statistic_feed_table: string;
  statistic_treatment: string;
  statistic_treatment_table: string;
  statistic_rating_table: string;
  statistic_queen_table: string;
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
      statistic_harvest: '',
      statistic_harvest_table: '',
      statistic_feed: '',
      statistic_feed_table: '',
      statistic_treatment: '',
      statistic_treatment_table: '',
      statistic_rating_table: '',
      statistic_queen_table: ''
    }) as State,
  getters: {
    field: state => {
      return (table: string, key: string) => {
        try {
          const stateTable = state[table];
          if (!stateTable) {
            return null;
          }
          const values = JSON.parse(stateTable);
          const filtered = values.filter((o: any) => key in o);
          if (filtered) {
            return filtered[0][key];
          }
          return null;
        } catch (e: any) {
          console.error(e);
          return null;
        }
      };
    },
    table: state => {
      return (table: string) => {
        return state[table];
      };
    }
  },
  actions: {
    updateYear(table: string, change: number) {
      let values;
      try {
        let found = false;
        values = JSON.parse(this[table]!);
        values = map(values, o => {
          if ('year' in o) {
            found = true;
            o.year = o.year + change;
          }
          return o;
        });
        if (!found) {
          values.push({
            year: new Date().getFullYear() + change
          });
        }
      } catch (e) {
        console.error(e);
        values = [
          {
            year: new Date().getFullYear() + change
          }
        ];
      }
      this[table] = JSON.stringify(values);
      return values;
    },
    update(table: string, payload: any) {
      if (payload) {
        const array = map(payload, (o, key) => {
          if (!o) {
            return null;
          }
          if (isArray(o)) {
            if (o.length === 0) {
              return null;
            }
            return { [key]: deepUnref(o).map((v: any) => v.id) };
          }
          if (
            key === 'date' ||
            key === 'queens.date' ||
            key === 'queens.move_date'
          ) {
            return { [key]: o };
          }
          if ('id' in o) {
            return { [key]: o.id };
          }
        });
        const clean = compact(array);
        if (isEmpty(clean)) {
          this.reset(table);
        } else {
          try {
            const values = JSON.stringify(clean);
            this[table] = values;
          } catch (e) {
            console.error(e);
            this.reset(table);
          }
        }
      } else {
        this.reset(table);
      }
    },
    reset(table: string) {
      this[table] = '';
    }
  }
});
