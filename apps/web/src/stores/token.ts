import { Token } from '~/types';
import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';

export const useAuthTokenStore = defineStore('auth/token', {
  state: () => ({
    token: useStorage<Token | Record<string, never>>('token', {}),
  }),
  getters: {
    getToken: (state) => state.token,
    getRefreshToken: (state) => state.token?.refreshToken,
    getAccessToken: (state) => state.token?.accessToken,
  },
  actions: {
    refreshToken(payload: Token) {
      this.token = { ...payload };
    },
    removeToken() {
      this.token = {};
    },
  },
});

export type useAuthTokenStore = ReturnType<typeof useAuthTokenStore>;
