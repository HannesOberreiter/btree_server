//import { useAuthTokenStore } from '~/stores/token';
import { useNeedAuth } from './useNeedAuth';
import querystring from 'query-string';
import { isString } from 'lodash-es';
import { LoadingBar } from 'quasar';
import { useNetwork } from '@vueuse/core';
import { reactive } from 'vue';

const baseUrl = process.env.BACKEND_URL;
const dev = process.env.NODE_ENV;

const state = reactive({
  retry: false,
  logout: false,
});

export const useApiFetch = () => {
  //const storeToken = useAuthTokenStore();
  const network = useNetwork();
  const dialog = useNeedAuth();

  const buildHeader = () => {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json;charset=UTF-8',
    };
  };

  /*const buildToken = () => {
    const token = storeToken.getAccessToken;
    if (token) return { Authorization: `Bearer ${token}` };
    return false;
  };*/

  const buildUrl = (url: string, param = '' as unknown) => {
    if (param === '') return baseUrl + url;
    else
      return (
        baseUrl +
        url +
        '?' +
        querystring.stringify(param, { arrayFormat: 'bracket' })
      );
  };

  const ping = async () => {
    const controller = new AbortController();
    const { signal } = controller;
    const id = setTimeout(() => controller.abort(), 15000);
    const urlParam = buildUrl('/v1/status');
    const request = new Request(urlParam, {
      signal,
      method: 'HEAD', // *GET, POST, PUT, DELETE, etc.
      credentials: 'omit', // include, *same-origin, omit
      headers: buildHeader(),
    });
    const time1 = performance.now();
    const response = await fetch(request).catch((e) => {
      console.error(e);
      throw 'offline';
    });
    clearTimeout(id);

    if (!response.ok) {
      throw 'offline';
    }

    const time2 = performance.now();
    return time2 - time1;
  };

  const download = async (url: string) => {
    const urlParam = buildUrl(url);
    const originalRequest = new Request(urlParam, {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: buildHeader(),
    });

    return await fetching(originalRequest, false, true);
  };

  const get = async (
    url: string,
    payload = '' as unknown,
    loadingIndicator = true,
    showPopup = true,
    credentials = true,
  ): Promise<any> => {
    const urlParam = buildUrl(url, payload);
    const originalRequest = new Request(urlParam, {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: credentials ? 'include' : 'omit', // include, *same-origin, omit
      headers: buildHeader(),
    });

    return await fetching(
      originalRequest,
      false,
      false,
      loadingIndicator,
      showPopup,
    );
  };

  const remove = async (url: string, payload = '' as unknown): Promise<any> => {
    const urlParam = buildUrl(url, payload);
    const originalRequest = new Request(urlParam, {
      method: 'DELETE', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: buildHeader(),
    });

    return await fetching(originalRequest);
  };

  const post = async (url: string, payload: unknown): Promise<any> => {
    const urlParam = buildUrl(url, '');
    const originalRequest = new Request(urlParam, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: buildHeader(),
      body: isString(payload) ? (payload as string) : JSON.stringify(payload),
    });

    return await fetching(originalRequest);
  };

  const patch = async (url: string, payload: unknown): Promise<any> => {
    const urlParam = buildUrl(url, '');
    const originalRequest = new Request(urlParam, {
      method: 'PATCH', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: buildHeader(),
      body: isString(payload) ? (payload as string) : JSON.stringify(payload),
    });
    return await fetching(originalRequest);
  };

  async function fetching(
    request: Request,
    recursive = false,
    file = false,
    loadingIndicator = true,
    showPopup = true,
  ): Promise<any> {
    if (
      network.isSupported &&
      !network.isOnline.value &&
      dev !== 'development'
    ) {
      throw 'offline';
    }
    if (state.logout) throw 'error.forbidden';

    if (loadingIndicator) LoadingBar.start();
    //const token = buildToken();
    const copy = request.clone();
    //if (token) request.headers.append('Authorization', token.Authorization);
    const response = await fetch(request);
    if (loadingIndicator) LoadingBar.stop();

    if (!response.ok) {
      if (
        request.url.search('/v1/auth/login') === -1 &&
        request.url.search('/v1/auth/refresh') === -1 &&
        showPopup
      ) {
        // 401 Response and it is currently no retry ongoing
        if (response.status === 401 && !state.retry && !recursive) {
          try {
            //const token = await refreshToken();
            //storeToken.refreshToken(token.result);
            state.retry = true;
            return fetching(copy, true, file);
          } catch (e) {
            state.retry = false;
            throw e;
          }
          // This was a recursive copy to try again and it again failed with authentication
        } else if (response.status === 401 && recursive) {
          state.logout = true;
          state.retry = false;
        } else if (response.status === 401) {
          while (state.retry === true) {
            // Wait till first request finish refresh token, request
            await new Promise((r) => setTimeout(r, 500));
          }
          if (state.logout === true) {
            if (!dialog.state.show && showPopup) dialog.open();
            return Promise.reject();
          }
          return fetching(copy, true, file);
        }
      }
      throw await response.json();
    }

    if (state.retry) {
      state.retry = false; // fetch did work after a retry, waiting promises can now try
      state.logout = false;
    }
    if (file) {
      return response.blob();
    } else {
      return response.json();
    }
  }

  /*async function refreshToken() {
    const token = buildToken();
    const urlParam = baseUrl + '/v1/auth/refresh';
    const request = new Request(urlParam, {
      method: 'POST',
      credentials: 'include',
      headers: buildHeader(),
      body: JSON.stringify(storeToken.getRefreshToken),
    });
    if (token) request.headers.append('Authorization', token.Authorization);

    return fetch(request)
      .then(function (response) {
        if (!response.ok) {
          state.logout = true;
          dialog.open();
          throw response;
        }
        return response;
      })
      .then(function (response) {
        state.retry = false;
        return response.json();
      })
      .catch(async function (error) {
        throw await error.json();
      });
  }*/

  return { ping, get, post, patch, remove, state, download };
};
