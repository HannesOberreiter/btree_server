import { boot } from 'quasar/wrappers';
import {
  QueryCache,
  VueQueryPlugin,
  VueQueryPluginOptions,
} from '@tanstack/vue-query';

export const queryCache = new QueryCache({
  onError: (error) => {
    console.error(error);
  },
  onSuccess: (_data) => {
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
        cacheTime: 1000 * 60 * 60 * 48, // garbage collector, every 24 hours
      },
    },
  },
};
export default boot(({ app }) => {
  app.use(VueQueryPlugin, vueQueryPluginOptions);
});
