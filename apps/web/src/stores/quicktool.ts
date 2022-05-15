import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
import { Task } from '~/types';

export const useQuicktoolStore = defineStore('quicktool', {
  state: () => ({
    link: useStorage<Task>('quicktool', 'checkup'),
  }),
  getters: {
    getLink: (state) => state.link,
  },
  actions: {},
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useQuicktoolStore, import.meta.hot));
}
