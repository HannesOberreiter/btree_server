import { useStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { CALENDAR } from '../constants';

export const useCalendarStore = defineStore('calendar', {
  state: () => ({
    calendar: useStorage<string[]>('calendar', CALENDAR)
  }),
  getters: {
    getState: state => state.calendar
  },
  actions: {
    reset() {
      this.calendar = CALENDAR;
    }
  }
});
