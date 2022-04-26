import { boot } from 'quasar/wrappers';
import { QueryCache, VueQueryPlugin, VueQueryPluginOptions } from 'vue-query';

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
        staleTime: 1000 * 60 * 1, // stale (refetching), after 1 minute
        cacheTime: 1000 * 60 * 60 * 24, // garbage collector, every 24 hours
      },
    },
  },
};
export default boot(({ app }) => {
  app.use(VueQueryPlugin, vueQueryPluginOptions);
});
