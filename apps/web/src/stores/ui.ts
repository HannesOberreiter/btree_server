import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
interface Ui {
  sidebar: boolean;
  overlay: boolean;
  calendarSources: string[] | null;
}

export const useUiStore = defineStore('ui', {
  state: () => ({
    ui: useStorage<Ui>('ui', {
      sidebar: false,
      overlay: false,
      calendarSources: null,
    }),
  }),
  getters: {
    getState: (state) => state,
    existsCalendarSources: (state) => {
      if (state.ui.calendarSources === null) {
        return false;
      }
      return true;
    },
  },
  actions: {
    loaderOn() {
      this.ui.overlay = true;
    },
    loaderOff() {
      this.ui.overlay = false;
    },
    changeSidebar() {
      this.ui.sidebar = !this.ui.sidebar;
    },
  },
});
