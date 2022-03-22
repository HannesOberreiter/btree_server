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
