import { useStorage } from '@vueuse/core';
import dayjs from 'dayjs';
import { defineStore } from 'pinia';
import refreshService from '../services/refresh.service';

export const useRefreshStore = defineStore('refresh', {
  state: () => ({
    last: useStorage('refresh', dayjs('1989-05-01'))
  }),
  getters: {
    lastHour: state => dayjs(state.last).diff(dayjs(), 'hour'),
    indicatorColor: state => {
      const diff = dayjs(state.last).diff(dayjs(), 'hour');
      let color = 'text-green';
      if (diff > 5) {
        color = 'text-orange';
      }
      if (diff > 5) {
        color = 'text-red';
      }
      return color;
    }
  },
  actions: {
    async refresh(user = true) {
      if (this.lastHour < -1 || Number.isNaN(this.lastHour) || user) {
        this.last = dayjs();
        return await refreshService.refresh(user);
      }
    }
  }
});
