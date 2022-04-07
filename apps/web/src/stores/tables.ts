import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';

export const useTablesStore = defineStore('tables', {
  state: () => ({
    hive: {
      visible: useStorage('table-visible-hive', ['apiary_name']),
      length: useStorage('table-length-hive', 10),
      sort: useStorage('table-sort-col-hive', 'name'),
      direction: useStorage('table-sort-direction-hive', false),
    },
    apiary: {
      visible: useStorage('table-visible-apiary', ['name', 'description']),
      length: useStorage('table-length-apiary', 10),
      sort: useStorage('table-sort-col-apiary', 'name'),
      direction: useStorage('table-sort-direction-apiary', false),
    },
    movedate: {
      visible: useStorage('table-visible-movedate', [
        'date',
        'hive.name',
        'apiary.name',
      ]),
      length: useStorage('table-length-movedate', 10),
      sort: useStorage('table-sort-col-movedate', 'date'),
      direction: useStorage('table-sort-direction-movedate', false),
    },
  }),
  getters: {},
  actions: {},
});
