import { useNeedAuth } from './useNeedAuth';
import querystring from 'query-string';
import { isString } from 'lodash-es';
import { LoadingBar } from 'quasar';
import { useNetwork } from '@vueuse/core';
import { useBackend } from './useBackend';

const dev = process.env.NODE_ENV;

export const useApiFetch = () => {
  const backend = useBackend();
  const network = useNetwork();
  const dialog = useNeedAuth();
  const baseUrl = backend.url;

  const buildHeader = () => {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json;charset=UTF-8',
    };
  };

  const buildUrl = (url: string, param = '' as any) => {
    if (param === '') return baseUrl.value + url;
    return (
      baseUrl.value +
      url +
      '?' +
      querystring.stringify(param, { arrayFormat: 'bracket' })
    );
  };

  const ping = async () => {
    const controller = new AbortController();
    const { signal } = controller;
    const id = setTimeout(() => controller.abort(), 15000);
    const urlParam = buildUrl('/v1/auth/ping');
    const request = new Request(urlParam, {
      signal,
      method: 'HEAD',
      credentials: 'include',
      headers: buildHeader(),
    });
    const time1 = performance.now();
    const response = await fetch(request).catch((e) => {
      console.error(e);
      throw 'offline';
    });
    clearTimeout(id);

    /** 401 response means that session is expired */
    if (response.status === 401) {
      if (!dialog.state.show) dialog.open();
      throw 'error.forbidden';
    }

    if (!response.ok) {
      throw 'offline';
    }

    /** reset logout dialog if as the session is recovered at this point */
    if (dialog.state.show) dialog.close();

    const time2 = performance.now();
    return time2 - time1;
  };

  const download = async (url: string) => {
    const urlParam = buildUrl(url);
    const originalRequest = new Request(urlParam, {
      method: 'GET',
      credentials: 'include',
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
      method: 'GET',
      credentials: credentials ? 'include' : 'omit',
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
      method: 'DELETE',
      credentials: 'include',
      headers: buildHeader(),
      body: '{}',
    });

    return await fetching(originalRequest);
  };

  const post = async (url: string, payload: unknown): Promise<any> => {
    const urlParam = buildUrl(url, '');
    const originalRequest = new Request(urlParam, {
      method: 'POST',
      credentials: 'include',
      headers: buildHeader(),
      body: isString(payload) ? (payload as string) : JSON.stringify(payload),
    });

    return await fetching(originalRequest);
  };

  const postMultiPart = async (
    url: string,
    payload: Record<string, any>,
  ): Promise<any> => {
    const urlParam = buildUrl(url, '');
    const mulitpartPayload = new FormData();
    for (const key in payload) {
      mulitpartPayload.append(key, payload[key]);
    }
    const originalRequest = new Request(urlParam, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
        Accept: 'application/json',
      },
      body: mulitpartPayload,
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
    _recursive = false,
    file = false,
    loadingIndicator = true,
    _showPopup = true,
  ): Promise<any> {
    if (
      network.isSupported &&
      !network.isOnline.value &&
      dev !== 'development'
    ) {
      throw 'offline';
    }

    if (loadingIndicator) LoadingBar.start();
    const response = await fetch(request);
    if (loadingIndicator) LoadingBar.stop();

    if (!response.ok) {
      if (
        request.url.search('/v1/auth/') === -1 &&
        window.location.href.search('/visitor/') === -1 &&
        response.status === 401
      ) {
        if (!dialog.state.show) dialog.open();
        throw 'error.forbidden';
      }
      throw await response.json();
    }
    if (file) {
      return response.blob();
    } else {
      return response.json();
    }
  }

  /**
   * @description get stream data from server
   */
  const stream = (url: string, payload = '' as unknown) => {
    const urlParam = buildUrl(url, '');
    const originalRequest = new Request(urlParam, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/octet-stream',
        'Content-Type': 'application/json;charset=UTF-8',
      },
      body: isString(payload) ? (payload as string) : JSON.stringify(payload),
    });

    return fetch(originalRequest);
  };
  return { ping, get, post, patch, remove, download, stream, postMultiPart };
};
