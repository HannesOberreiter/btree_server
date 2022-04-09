import { useAuthTokenStore } from '~/stores/token';
import { useNeedAuth } from './useNeedAuth';
import { stringify } from 'query-string';
import { isString } from 'lodash-es';
import { LoadingBar } from 'quasar';

const baseUrl = '/api';
const state = reactive({
  retry: false,
  logout: false,
});

export const useApiFetch = () => {
  const storeToken = useAuthTokenStore();

  const buildHeader = () => {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json;charset=UTF-8',
    };
  };

  const buildToken = () => {
    const token = storeToken.getAccessToken;
    if (token) return { Authorization: `Bearer ${token}` };
    return false;
  };

  const buildUrl = (url: string, param = '' as unknown) => {
    if (param === '') return baseUrl + url;
    else
      return baseUrl + url + '?' + stringify(param, { arrayFormat: 'bracket' });
  };

  const get = async (url: string, payload = '' as unknown): Promise<any> => {
    const urlParam = buildUrl(url, payload);
    const originalRequest = new Request(urlParam, {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'omit', // include, *same-origin, omit
      headers: buildHeader(),
    });

    return await fetching(originalRequest);
  };

  const deleting = async (
    url: string,
    payload = '' as unknown
  ): Promise<any> => {
    const urlParam = buildUrl(url, payload);
    const originalRequest = new Request(urlParam, {
      method: 'DELETE', // *GET, POST, PUT, DELETE, etc.
      credentials: 'omit', // include, *same-origin, omit
      headers: buildHeader(),
    });

    return await fetching(originalRequest);
  };

  const post = async (url: string, payload: unknown): Promise<any> => {
    const urlParam = buildUrl(url, '');
    const originalRequest = new Request(urlParam, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      credentials: 'omit', // include, *same-origin, omit
      headers: buildHeader(),
      body: isString(payload) ? (payload as string) : JSON.stringify(payload),
    });

    return await fetching(originalRequest);
  };

  const patch = async (url: string, payload: unknown): Promise<any> => {
    const urlParam = buildUrl(url, '');
    const originalRequest = new Request(urlParam, {
      method: 'PATCH', // *GET, POST, PUT, DELETE, etc.
      credentials: 'omit', // include, *same-origin, omit
      headers: buildHeader(),
      body: isString(payload) ? (payload as string) : JSON.stringify(payload),
    });
    console.log(JSON.stringify(payload));
    return await fetching(originalRequest);
  };

  async function fetching(request: Request, recursive = false): Promise<any> {
    LoadingBar.start();
    const token = buildToken();
    const copy = request.clone();
    if (token) request.headers.append('Authorization', token.Authorization);
    const response = await fetch(request);
    if (!response.ok) {
      if (
        ![baseUrl + '/v1/auth/login', baseUrl + '/v1/auth/refresh'].includes(
          request.url
        ) &&
        !recursive
      ) {
        if (response.status === 401 && !state.retry) {
          state.retry = true;
          try {
            const token = await refreshToken();
            storeToken.refreshToken(token.result);
            return fetching(copy, true);
          } catch (e) {
            throw e;
          }
        } else if (response.status === 401) {
          while (state.retry === true) {
            // Wait till first request finish refresh token, request
            await new Promise((r) => setTimeout(r, 500));
          }
          if (state.logout === true) return Promise.reject();
          return fetching(copy, true);
        }
      }
      LoadingBar.stop();
      throw await response.json();
    }
    LoadingBar.stop();

    return response.json();
  }

  async function refreshToken() {
    const token = buildToken();
    const urlParam = baseUrl + '/v1/auth/refresh';
    const request = new Request(urlParam, {
      method: 'POST',
      credentials: 'omit',
      headers: buildHeader(),
      body: JSON.stringify(storeToken.getRefreshToken),
    });
    if (token) request.headers.append('Authorization', token.Authorization);

    return fetch(request)
      .then(function (response) {
        if (!response.ok) {
          const dialog = useNeedAuth();
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
  }

  return { get, post, patch, deleting, state };
};
