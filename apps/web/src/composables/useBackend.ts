import { useLocalStorage } from '@vueuse/core';
import { computed } from 'vue';
import { API_SERVER } from '../constants';

type Server = 'eu' | 'us';

const isDev = process.env.NODE_ENV !== 'production';
const baseUrl = process.env.BACKEND_URL;
const baseUrlUS = process.env.BACKEND_URL_US;

const backends: {
  [key: string]: string;
} = {
  eu: baseUrl,
};
if (baseUrlUS) {
  backends['us'] = baseUrlUS;
}

const validServers = Object.keys(backends);

const options: Array<{ label: string; id: string }> = [
  { label: API_SERVER['eu'], id: 'eu' },
];
if (baseUrlUS) {
  options.push({ label: API_SERVER['us'], id: 'us' });
}

export const useBackend = () => {
  const params = new URLSearchParams(window.location.search);
  const paramServer = params.get('server');

  const server =
    paramServer && validServers.includes(paramServer)
      ? (paramServer as Server)
      : null;

  const state = useLocalStorage<Server>(
    'backend-location',
    server === 'us' ? 'us' : 'eu',
  );

  if (server) {
    state.value = server;
  }

  const url = computed(() => {
    const server = state.value;
    const url = backends[server] || baseUrl;
    if (isDev)
      return server !== 'eu'
        ? '/' + server + new URL(url).pathname // reverse proxy is set to trigger on /[server]/api ...
        : new URL(url).pathname; // reverse proxy is set to trigger on /api
    return url;
  });
  const urlIgnoreProxy = computed(() => backends[state.value] || baseUrl);

  return {
    state,
    setBackend: (value: string) => {
      if (!backends[value]) {
        throw new Error('Invalid backend');
      }
      state.value = value as Server;
    },
    getOption: () => options.find((o) => o.id === state.value),
    findOption: (id: string) => options.find((o) => o.id === id),
    getOtherOption: () => options.filter((o) => o.id != state.value),
    isServerParam: !!server,
    urlIgnoreProxy,
    url,
    options,
  };
};
