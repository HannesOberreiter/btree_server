import type { Company, User } from '../types';
import { usePreferredLanguages, useStorage } from '@vueuse/core';
import dayjs from 'dayjs';
import { isEmpty } from 'lodash-es';
import { defineStore } from 'pinia';
import { i18n } from '../boot/i18n';
import { Router } from '../router';
import AuthService from '../services/auth.service';

export const useAuthUserStore = defineStore('auth/user', {
  state: () => ({
    user: useStorage<User | Record<string, never>>('user', {}),
    company: useStorage<Company | Record<string, never>>('company', {}),
    activate: ''
  }),
  getters: {
    isLoggedIn: state => {
      return !isEmpty(state.user) && !isEmpty(state.company);
    },
    getLanguage: state => {
      const languages = usePreferredLanguages();
      const preferred = !isEmpty(state.user)
        ? state.user.lang
        : languages.value[0];
      let lang = preferred?.toLowerCase().split('-')[0];
      if (!lang) {
        lang = 'en';
      }
      if (!['de', 'fr', 'it'].includes(lang)) {
        lang = 'en';
      }
      return lang;
    },
    getUser: state => state.user,
    getCompany: state => state.company,
    getDateFormat: state => state.user.format,
    isReadOnly: state => state.company.rank === 3,
    isAdmin: state => state.company.rank === 1,
    isPremium: state => {
      const company = state.company;
      const date = dayjs(company.paid);
      if (!date.isValid()) {
        return false;
      }
      if (date < dayjs()) {
        return false;
      }
      return true;
    },
    /*
     * Reads Company Object and returns helpful object
     */
    getPaidStatus: state => {
      const company = state.company;
      const result = {
        date: '---',
        name: 'Basic',
        icon: 'far fa-thumbs-down',
        status: false,
        rank: {
          name: 'Read-Only',
          id: 3
        }
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
    }
  },
  actions: {
    async checkLoginStatus() {
      const data = await AuthService.checkLogin();
      if (data) {
        this.refresh(data);
        return true;
      }
      return false;
    },
    updateLang() {
      i18n.global.locale.value = (this.getLanguage ?? 'en') as any;
    },
    login(user: User) {
      return AuthService.login(user).then(
        async (res: any) => {
          this.refresh(res.data);
          return Promise.resolve(user);
        },
        (error: any) => {
          console.error(error);
          this.user = {};
          this.company = {};
          return Promise.reject(error);
        }
      );
    },
    async logout() {
      await AuthService.logout();
      this.user = {};
      this.company = {};
      localStorage.removeItem('user');
      localStorage.removeItem('company');
      return await Router.push({
        name: 'login',
        query: { next: Router.currentRoute.value.path }
      }).then(v => v);
    },
    refresh(data: any) {
      const curCompany = AuthService.getCurrentCompany(data);
      this.user = data;
      this.company = curCompany;
      this.updateLang();
    }
  }
});
