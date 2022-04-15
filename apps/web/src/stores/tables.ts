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
    todo: {
      visible: useStorage('table-visible-todo', [
        'date',
        'name',
        'note',
        'done',
      ]),
      length: useStorage('table-length-todo', 10),
      sort: useStorage('table-sort-col-todo', 'date'),
      direction: useStorage('table-sort-direction-todo', false),
    },
  }),
  getters: {},
  actions: {},
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTablesStore, import.meta.hot));
}
