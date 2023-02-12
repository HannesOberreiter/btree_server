import { acceptHMRUpdate, defineStore } from 'pinia';

export const useRouterStore = defineStore('router', {
  state: () => ({ previous: '', params: '' }),
  getters: {
    isPrevious: (state) => (state.previous ? true : false),
  },
  actions: {},
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRouterStore, import.meta.hot));
}
