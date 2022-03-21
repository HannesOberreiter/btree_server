import { isEmpty } from 'lodash';
import dayjs from 'dayjs';
import { usePreferredLanguages } from '@vueuse/core';
import { acceptHMRUpdate, defineStore } from 'pinia';

import { User, Company } from '~/types';
import { useStorage } from '@vueuse/core';
import AuthService from '~/services/auth.service';
import { useAuthTokenStore } from './token';
import { Router } from '~/router';
import { useRefreshStore } from './refresh';
import { i18n, setLocale } from '~/boot/i18n';

export const useAuthUserStore = defineStore('auth/user', {
  state: () => ({
    user: useStorage<User | Record<string, never>>('user', {}),
    company: useStorage<Company | Record<string, never>>('company', {}),
  }),
  getters: {
    isLoggedIn: (state) => {
      const tokenStore = useAuthTokenStore();
      return !isEmpty(state.user) && !isEmpty(tokenStore.getToken);
    },
    getLanguage: (state) => {
      const languages = usePreferredLanguages();
      let lang = !isEmpty(state.user) ? state.user.lang : languages.value[0];
      if (lang !== 'de') lang = 'en';
      return lang;
    },
    getUser: (state) => state.user,
    getCompany: (state) => state.company,
    isReadOnly: (state) => state.company.rank === 3,
    isAdmin: (state) => state.company.rank === 1,
    /*
     * Reads Company Object and returns helpful object
     */
    getPaidStatus: (state) => {
      const company = state.company;
      const result = {
        date: '---',
        name: 'Basic',
        icon: 'far fa-thumbs-down',
        status: false,
        rank: {
          name: 'Read-Only',
          id: 3,
        },
      };
      const date = dayjs(company.paid);
      if (date.isValid()) {
        result.date = date.format('YYYY-MM-DD');
        if (date >= dayjs()) {
          result.name = 'Premium';
          result.status = true;
          result.icon = 'far fa-thumbs-up';
        }
      }
      if (company.rank === 2) {
        result.rank.name = 'User';
        result.rank.id = 2;
      } else if (company.rank === 1) {
        result.rank.name = 'Admin';
        result.rank.id = 1;
      }
      return result;
    },
  },
  actions: {
    updateLang() {
      setLocale(i18n, this.getLanguage);
    },
    login(user: User) {
      return AuthService.login(user).then(
        async (res: any) => {
          this.refresh(res.data);
          await useRefreshStore().refresh();
          return Promise.resolve(user);
        },
        (error: any) => {
          this.user = {};
          this.company = {};
          return Promise.reject(error);
        }
      );
    },
    async logout() {
      this.user = {};
      this.company = {};
      localStorage.removeItem('token');
      localStorage.removeItem('refresh');
      await Router.push({ name: 'login' });
    },
    refresh(data: any) {
      const curCompany = AuthService.getCurrentCompany(data);
      this.user = data;
      this.company = curCompany;
      this.updateLang();
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthUserStore, import.meta.hot));
}
