import { useLocalStorage } from '@vueuse/core';
import { computed } from 'vue';
import { API_SERVER } from '~/constants';

const baseUrl = process.env.BACKEND_URL;
const baseUrlUS = process.env.BACKEND_URL_US;

const backends: { [key: string]: string } = {
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

  const server = validServers.includes(paramServer) ? paramServer : null;

  const state = useLocalStorage(
    'backend-location',
    server === 'us' ? 'us' : 'eu',
  );

  if (server) {
    state.value = server;
  }

  const url = computed(() => backends[state.value] || baseUrl);

  return {
    state,
    setBackend: (value: string) => {
      if (!backends[value]) {
        throw new Error('Invalid backend');
      }
      state.value = value;
    },
    getOption: () => options.find((o) => o.id === state.value),
    findOption: (id: string) => options.find((o) => o.id === id),
    getOtherOption: () => options.filter((o) => o.id != state.value),
    isServerParam: !!server,
    url,
    options,
  };
};
