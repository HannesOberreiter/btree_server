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
    feed: {
      visible: useStorage('table-visible-feed', [
        'date',
        'type.name',
        'hive.name',
        'done',
      ]),
      length: useStorage('table-length-feed', 10),
      sort: useStorage('table-sort-col-feed', 'date'),
      direction: useStorage('table-sort-direction-feed', false),
    },
    harvest: {
      visible: useStorage('table-visible-harvest', [
        'date',
        'type.name',
        'hive.name',
        'done',
      ]),
      length: useStorage('table-length-harvest', 10),
      sort: useStorage('table-sort-col-harvest', 'date'),
      direction: useStorage('table-sort-direction-harvest', false),
    },
    treatment: {
      visible: useStorage('table-visible-treatment', [
        'date',
        'type.name',
        'hive.name',
        'done',
      ]),
      length: useStorage('table-length-treatment', 10),
      sort: useStorage('table-sort-col-treatment', 'date'),
      direction: useStorage('table-sort-direction-treatment', false),
    },
    checkup: {
      visible: useStorage('table-visible-checkup', [
        'date',
        'type.name',
        'hive.name',
        'done',
      ]),
      length: useStorage('table-length-checkup', 10),
      sort: useStorage('table-sort-col-checkup', 'date'),
      direction: useStorage('table-sort-direction-checkup', false),
    },
  }),
  getters: {},
  actions: {},
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTablesStore, import.meta.hot));
}
