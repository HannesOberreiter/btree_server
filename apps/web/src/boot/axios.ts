import { boot } from 'quasar/wrappers';
import axios, { AxiosInstance } from 'axios';

import { useAuthTokenStore } from '../stores/token';
import { useNeedAuth } from '~/composables/useNeedAuth';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
  }
}

const api = axios.create({
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  baseURL: '/api',
  withCredentials: false,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json;charset=UTF-8',
  },
});

// https://www.bezkoder.com/vue-3-refresh-token/
const setup = () => {
  api.interceptors.request.use(
    (config) => {
      const storeToken = useAuthTokenStore();
      const token = storeToken.getAccessToken;
      if (token) {
        if (config.headers) config.headers['Authorization'] = 'Bearer ' + token;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  let retry = false;
  let logout = false;
  api.interceptors.response.use(
    (res) => {
      return res;
    },
    async (err) => {
      const storeToken = useAuthTokenStore();
      const originalConfig = err.config;
      if (
        originalConfig.url !== '/v1/auth/login' &&
        originalConfig.url !== '/v1/auth/refresh' &&
        err.response
      ) {
        // Access Token expired
        if (err.response.status === 401 && !retry) {
          retry = true;
          await api.post('/v1/auth/refresh', storeToken.getRefreshToken).then(
            (res) => {
              storeToken.refreshToken(res.data.result);
              retry = false;
              return api(originalConfig);
            },
            async (error) => {
              //await AuthService.logout();
              const dialog = useNeedAuth();
              logout = true;
              retry = false;
              dialog.open();
              return Promise.reject(error);
            }
          );
        } else if (err.response.status === 401) {
          // if we have multiple calls async to our api
          // we loop and wait till refresh token is regenerated
          while (retry === true) {
            await new Promise((r) => setTimeout(r, 500));
          }
          if (logout === true) return Promise.reject(err);
          return api(originalConfig);
        }
      }
      return Promise.reject(err);
    }
  );
};

setup();

export default boot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api
  app.config.globalProperties.$axios = axios;
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api;
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
});

export { axios, api };
