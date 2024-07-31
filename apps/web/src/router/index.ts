import { Loading, LoadingBar } from 'quasar';

import { route } from 'quasar/wrappers';
import { useAuthUserStore } from '~/stores/auth';
import { useRefreshStore } from '~/stores/refresh';
import { useRouterStore } from '~/stores/router';
import routes from './routes';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

const createHistory = process.env.SERVER
  ? createMemoryHistory
  : process.env.VUE_ROUTER_MODE === 'history'
    ? createWebHistory
    : createWebHashHistory;

const Router = createRouter({
  scrollBehavior: () => ({ left: 0, top: 0 }),
  routes,

  // Leave this as is and make changes in quasar.conf.js instead!
  // quasar.conf.js -> build -> vueRouterMode
  // quasar.conf.js -> build -> publicPath
  history: createHistory(process.env.VUE_ROUTER_BASE),
});

export default route(function ({ store }) {
  const routerStore = useRouterStore(store);
  const storeUser = useAuthUserStore(store);
  const refreshStore = useRefreshStore(store);

  Router.beforeEach(async (to, from, next) => {
    /**
      Stopping pending loading bars
      The first command will hide ones which are full but wont get removed
      does happen sometimes but don't know when this "bug" happens
     */
    Array.from(
      document.getElementsByClassName('q-loading-bar--bottom'),
    ).forEach((e) => e.setAttribute('style', 'opacity:0;'));
    if (LoadingBar.isActive) LoadingBar.stop();
    if (Loading.isActive) Loading.hide();
    if (
      to.matched.some((record) => record.meta.auth && !storeUser.isLoggedIn)
    ) {
      console.warn('User not logged in, redirect from', to.path);
      const query = to.query;
      next({ name: 'login', query: { next: to.path, ...query } });
    } else {
      if (
        to.matched.some((record) => record.meta.auth) &&
        (refreshStore.lastHour < -1 || isNaN(refreshStore.lastHour))
      ) {
        console.info('Updating local storage values');
        try {
          await refreshStore.refresh();
        } catch (e) {
          console.error(e);
        }
      }
      if (!(from.name === 'new-quicktool' && to.name === 'new-quicktool')) {
        routerStore.previous = from.name as any;
        routerStore.params = from.params as any;
      }

      if (
        to.matched.some((record) => record.meta.premium && !storeUser.isPremium)
      ) {
        console.warn('No premium user redirect');
        next({ name: 'login' });
      }
      next();
    }
  });

  return Router;
});

export { Router };
