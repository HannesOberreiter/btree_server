import { CALENDAR } from '~/constants';
import { acceptHMRUpdate, defineStore } from 'pinia';
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

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCalendarStore, import.meta.hot));
}
