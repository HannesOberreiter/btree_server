import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';

export const useTablesStore = defineStore('tables', {
  state: () => ({
    hive: {
      visible: useStorage('table-visible-hive', ['apiary_name']),
      length: useStorage('table-length-hive', 10),
      sort: useStorage('table-sort-col', 'name'),
      direction: useStorage('table-sort-direction', false),
    },
  }),
  getters: {},
  actions: {},
});
