import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  /***
    Path: /*
   */
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
        path: '/news',
        name: 'news',
        component: () => import('~/pages/News.vue'),
      },
    ],
  },
  /***
    Path: /table/*
   */
  {
    path: '/table',
    meta: {
      auth: true,
    },
    component: () => import('~/layouts/MainLayout.vue'),
    children: [
      {
        path: 'hive',
        name: 'table-hive',
        component: () => import('~/pages/HiveTable.vue'),
      },
      {
        path: 'apiary',
        name: 'table-apiary',
        component: () => import('~/pages/ApiaryTable.vue'),
      },
      {
        path: 'movement',
        name: 'table-movement',
        component: () => import('~/pages/MovementTable.vue'),
      },
      {
        path: 'todo',
        name: 'table-todo',
        component: () => import('~/pages/TodoTable.vue'),
      },
    ],
  },
  /***
    Path: /new/*
   */
  {
    path: '/new',
    meta: {
      auth: true,
    },
    component: () => import('~/layouts/MainLayout.vue'),
    children: [
      {
        path: 'quicktool/:task',
        name: 'new-quicktool',
        props: true,
        component: () => import('~/pages/QuicktoolNew.vue'),
      },
      {
        path: 'queen',
        name: 'new-queen',
        component: () => import('~/pages/QueenNew.vue'),
      },
      {
        path: 'hive',
        name: 'new-hive',
        component: () => import('~/pages/HiveNew.vue'),
      },
      {
        path: 'todo',
        name: 'new-todo',
        component: () => import('~/pages/TodoNew.vue'),
      },
      {
        path: 'movement',
        name: 'new-movement',
        component: () => import('~/pages/MovementNew.vue'),
      },
    ],
  },
  /***
    Path: /edit/*
   */
  {
    path: '/edit',
    meta: {
      auth: true,
    },
    component: () => import('~/layouts/MainLayout.vue'),
    children: [
      {
        path: ':task/:ids*',
        name: 'edit-quicktool',
        props: true,
        component: () => import('~/pages/QuicktoolEdit.vue'),
      },
      {
        path: 'queen/:ids*',
        name: 'edit-queen',
        props: true,
        component: () => import('~/pages/QueenEdit.vue'),
      },
      {
        path: 'todo/:ids*',
        name: 'edit-todo',
        props: true,
        component: () => import('~/pages/TodoEdit.vue'),
      },
      {
        path: 'movement/:ids*',
        name: 'edit-movement',
        props: true,
        component: () => import('~/pages/MovementEdit.vue'),
      },
    ],
  },
  /***
    Path: /visitor/*
   */
  {
    path: '/visitor',
    name: 'visitorTemplate',
    component: () => import('~/layouts/VisitorLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'login',
        props: true,
        component: () => import('~/pages/VisitorLogin.vue'),
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('~/pages/VisitorRegister.vue'),
      },
      {
        path: 'recover',
        name: 'recover',
        component: () => import('~/pages/VisitorRecover.vue'),
      },
      {
        path: 'reset/:reset',
        name: 'reset',
        props: true,
        component: () => import('~/pages/VisitorReset.vue'),
      },
      {
        path: 'activate/:activate',
        name: 'activate',
        props: true,
        component: () => import('~/pages/VisitorActivate.vue'),
      },
      {
        path: 'unsubscribe',
        name: 'unsubscribe',
        component: () => import('~/pages/VisitorUnsubscribe.vue'),
      },
    ],
  },
  /***
    Path: /map/*
   */
  {
    path: '/map',
    meta: {
      auth: true,
    },
    component: () => import('~/layouts/MainLayout.vue'),
    children: [
      {
        path: 'apiary',
        name: 'map-apiary',
        component: () => import('~/pages/MapApiary.vue'),
      },
      {
        path: 'wind',
        name: 'map-wind',
        component: () => import('~/pages/MapWind.vue'),
      },
    ],
  },
  /***
    Path: /setting/*
   */
  {
    path: '/setting',
    meta: {
      auth: true,
    },
    component: () => import('~/layouts/MainLayout.vue'),
    children: [
      {
        path: 'profile/:tab?',
        name: 'settingProfile',
        props: true,
        component: () => import('~/pages/SettingProfile.vue'),
      },
      {
        path: 'company/:tab?',
        name: 'settingCompany',
        props: true,
        component: () => import('~/pages/SettingCompany.vue'),
      },
      {
        path: 'field',
        name: 'settingField',
        component: () => import('~/pages/SettingField.vue'),
      },
      {
        path: 'dropbox/:token?',
        props: true,
        name: 'settingDropbox',
        component: () => import('~/pages/SettingDropbox.vue'),
      },
    ],
  },
  /***
    Catch last 404
   */
  {
    path: '/:catchAll(.*)*',
    component: () => import('~/pages/Error404.vue'),
  },
];

export default routes;
