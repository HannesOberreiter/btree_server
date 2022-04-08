import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
import dayjs from 'dayjs';
import refreshService from '~/services/refresh.service';

export const useRefreshStore = defineStore('refresh', {
  state: () => ({
    last: useStorage('refresh', dayjs('1989-05-01')),
  }),
  getters: {
    lastHour: (state) => dayjs(state.last).diff(dayjs(), 'hour'),
    indicatorColor: (state) => {
      const diff = dayjs(state.last).diff(dayjs(), 'hour');
      let color = 'text-green';
      if (diff > 5) color = 'text-orange';
      if (diff > 5) color = 'text-red';
      return color;
    },
  },
  actions: {
    async refresh() {
      try {
        this.last = dayjs();
        return await refreshService.refreshAll();
      } catch (e) {
        throw e;
      }
    },
  },
});
