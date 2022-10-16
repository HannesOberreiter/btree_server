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
    async refresh(user = true, clear = true) {
      try {
        this.last = dayjs();
        return await refreshService.refresh(user, clear);
      } catch (e) {
        throw e;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRefreshStore, import.meta.hot));
}
