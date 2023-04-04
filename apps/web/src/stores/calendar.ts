import { CALENDAR } from '~/constants';
import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';

export const useCalendarStore = defineStore('calendar', {
  state: () => ({
    calendar: useStorage<string[]>('calendar', CALENDAR),
  }),
  getters: {
    getState: (state) => state.calendar,
  },
  actions: {
    reset() {
      this.calendar = CALENDAR;
    },
  },
});
