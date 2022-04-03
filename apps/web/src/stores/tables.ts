import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';

export const useTablesStore = defineStore('tables', {
  state: () => ({
    visibleHive: useStorage('table-visible-hive', ['apiary_name']),
    lengthHive: useStorage('table-length-hive', 10),
    sortHive: useStorage('table-sort-col', 'name'),
    directionHive: useStorage('table-sort-direction', false),
  }),
  getters: {},
  actions: {},
});
