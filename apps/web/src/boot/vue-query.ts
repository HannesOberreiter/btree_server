import { boot } from 'quasar/wrappers';
import type { VueQueryPluginOptions } from '@tanstack/vue-query';
import { QueryCache, VueQueryPlugin } from '@tanstack/vue-query';
import { i18n } from './i18n';
import { useNotification } from '../composables/useNotification';

export const queryCache = new QueryCache({
  onError: (error) => {
    const notification = useNotification(i18n.global.t);
    console.log('queryCache.config.onError', error);
    notification.open('negative', error);
  },
  onSuccess: () => {
    //console.log(data);
  },
});

// https://vue-query.vercel.app/
const vueQueryPluginOptions: VueQueryPluginOptions = {
  queryClientConfig: {
    queryCache: queryCache,
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        staleTime: 1000 * 30, // stale (refetching), after 30 seconds
        gcTime: 1000 * 60 * 60 * 48, // garbage collector, every 24 hours
      },
    },
  },
};
export default boot(({ app }) => {
  app.use(VueQueryPlugin, vueQueryPluginOptions);
});
