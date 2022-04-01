import { Loading } from 'quasar';
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
    if (
      to.matched.some((record) => record.meta.auth && !storeUser.isLoggedIn)
    ) {
      next({ name: 'login', query: { next: to.fullPath } });
    } else {
      if (
        to.matched.some((record) => record.meta.auth) &&
        (refreshStore.lastHour < -1 || isNaN(refreshStore.lastHour))
      ) {
        Loading.show();
        console.log('Updating local storage values');
        await refreshStore.refresh();
        Loading.hide();
      }
      routerStore.previous = from.name as any;
      routerStore.params = from.params as any;
      next();
    }
  });

  return Router;
});

export { Router };
