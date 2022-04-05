import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    meta: {
      auth: true,
    },
    component: () => import('~/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'calendar',
        component: () => import('~/pages/Calendar.vue'),
      },
      {
        path: '/quicktool/:task',
        name: 'new-quicktool',
        props: true,
        component: () => import('~/pages/QuicktoolNew.vue'),
      },
      {
        path: '/edit/:task/:ids*',
        name: 'edit-quicktool',
        props: true,
        component: () => import('~/pages/QuicktoolEdit.vue'),
      },
      {
        path: '/new/hive',
        name: 'new-hive',
        component: () => import('~/pages/HiveNew.vue'),
      },
      {
        path: '/table/hive',
        name: 'table-hive',
        component: () => import('~/pages/HiveTable.vue'),
      },
      {
        path: '/new/todo',
        name: 'new-todo',
        component: () => import('~/pages/TodoNew.vue'),
      },
      {
        path: '/edit/todo/:ids*',
        name: 'edit-todo',
        props: true,
        component: () => import('~/pages/TodoEdit.vue'),
      },
      {
        path: '/new/movement',
        name: 'new-movement',
        component: () => import('~/pages/MovementNew.vue'),
      },
      {
        path: '/edit/movement/:ids*',
        name: 'edit-movement',
        props: true,
        component: () => import('~/pages/MovementEdit.vue'),
      },

      {
        path: '/new/queen',
        name: 'new-queen',
        component: () => import('~/pages/QueenNew.vue'),
      },
      {
        path: '/edit/queen/:ids*',
        name: 'edit-queen',
        props: true,
        component: () => import('~/pages/QueenEdit.vue'),
      },

      {
        path: '/map/apiary',
        name: 'map-apiary',
        component: () => import('~/pages/MapApiary.vue'),
      },
      {
        path: '/map/wind',
        name: 'map-wind',
        component: () => import('~/pages/MapWind.vue'),
      },
      {
        path: '/setting/profile/:tab?',
        name: 'settingProfile',
        props: true,
        component: () => import('~/pages/SettingProfile.vue'),
      },
      {
        path: '/setting/company/:tab?',
        name: 'settingCompany',
        props: true,
        component: () => import('~/pages/SettingCompany.vue'),
      },
      {
        path: '/setting/field',
        name: 'settingField',
        component: () => import('~/pages/SettingField.vue'),
      },
      {
        path: '/setting/dropbox/:token?',
        props: true,
        name: 'settingDropbox',
        component: () => import('~/pages/SettingDropbox.vue'),
      },
      {
        path: '/news',
        name: 'news',
        component: () => import('~/pages/News.vue'),
      },
    ],
  },
  {
    path: '/visitor',
    name: 'visitorTemplate',
    component: () => import('~/layouts/VisitorLayout.vue'),
    children: [
      {
        path: '/login',
        name: 'login',
        props: true,
        component: () => import('~/pages/VisitorLogin.vue'),
      },
      {
        path: '/register',
        name: 'register',
        component: () => import('~/pages/VisitorRegister.vue'),
      },
      {
        path: '/recover',
        name: 'recover',
        component: () => import('~/pages/VisitorRecover.vue'),
      },
      {
        path: '/reset/:reset',
        name: 'reset',
        props: true,
        component: () => import('~/pages/VisitorReset.vue'),
      },
      {
        path: '/activate/:activate',
        name: 'activate',
        props: true,
        component: () => import('~/pages/VisitorActivate.vue'),
      },
      {
        path: '/unsubscribe',
        name: 'unsubscribe',
        component: () => import('~/pages/VisitorUnsubscribe.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('~/pages/Error404.vue'),
  },
];

export default routes;
