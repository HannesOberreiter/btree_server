import { defineRouter } from '#q-app';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory
} from 'vue-router';
import { useLoadingManager } from '../composables/useLoadingManager';
import { useAuthUserStore } from '../stores/auth';
import { useRefreshStore } from '../stores/refresh';
import { useRouterStore } from '../stores/router';
import routes from './routes';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

const createHistory = import.meta.env.QUASAR_SERVER
  ? createMemoryHistory
  : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
    ? createWebHistory
    : createWebHashHistory;

const Router = createRouter({
  scrollBehavior: () => ({ left: 0, top: 0 }),
  routes,

  history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE)
});

export default defineRouter(({ store }) => {
  const routerStore = useRouterStore(store);
  const storeUser = useAuthUserStore(store);
  const refreshStore = useRefreshStore(store);
  const loadingManager = useLoadingManager();

  Router.beforeEach(async (to, from) => {
    loadingManager.forceStopAll();

    if (to.matched.some(record => record.meta.auth && !storeUser.isLoggedIn)) {
      console.warn('User not logged in, redirect from', to.path);
      const query = to.query;
      return { name: 'login', query: { next: to.path, ...query } };
    }

    if (
      to.matched.some(record => record.meta.premium && !storeUser.isPremium)
    ) {
      console.warn('No premium user redirect');
      return { name: 'login' };
    }

    if (!(from.name === 'new-quicktool' && to.name === 'new-quicktool')) {
      routerStore.previous = from.name as any;
      routerStore.params = from.params as any;
    }

    if (
      to.matched.some(record => record.meta.auth) &&
      (refreshStore.lastHour < -1 || Number.isNaN(refreshStore.lastHour))
    ) {
      console.info('Updating local storage values');
      refreshStore.refresh().catch(e => {
        console.error('Background refresh failed:', e);
      });
    }
  });

  return Router;
});

export { Router };
