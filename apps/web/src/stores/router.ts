import { defineStore } from 'pinia';

export const useRouterStore = defineStore('router', {
  state: () => ({ previous: '', params: '' }),
  getters: {
    isPrevious: (state) => (state.previous ? true : false),
  },
  actions: {},
});
