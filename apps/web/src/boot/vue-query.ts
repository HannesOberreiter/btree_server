import type { VueQueryPluginOptions } from '@tanstack/vue-query';
import { QueryCache, VueQueryPlugin } from '@tanstack/vue-query';
import { defineBoot } from '#q-app';
import { useNotification } from '../composables/useNotification';
import { i18n } from './i18n';

export const queryCache = new QueryCache({
  onError: error => {
    const notification = useNotification(i18n.global.t);
    console.error('queryCache.config.onError', error);
    notification.open('negative', error);
  },
  onSuccess: () => {
    // console.log(data);
  }
});

// https://vue-query.vercel.app/
const vueQueryPluginOptions: VueQueryPluginOptions = {
  queryClientConfig: {
    queryCache,
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        staleTime: 1000 * 30, // stale (refetching), after 30 seconds
        gcTime: 1000 * 60 * 60 * 48 // garbage collector, every 24 hours
      }
    }
  }
};
export default defineBoot(({ app }) => {
  app.use(VueQueryPlugin, vueQueryPluginOptions);
});
