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
        component: () => import('~/pages/TableHive.vue'),
      },
      {
        path: 'queen',
        name: 'table-queen',
        component: () => import('~/pages/TableQueen.vue'),
      },
      {
        path: 'apiary',
        name: 'table-apiary',
        component: () => import('~/pages/TableApiary.vue'),
      },
      {
        path: 'movement',
        name: 'table-movement',
        component: () => import('~/pages/TableMovement.vue'),
      },
      {
        path: 'todo',
        name: 'table-todo',
        component: () => import('~/pages/TableTodo.vue'),
      },
      {
        path: 'feed',
        name: 'table-feed',
        component: () => import('~/pages/TableFeed.vue'),
      },
      {
        path: 'harvest',
        name: 'table-harvest',
        component: () => import('~/pages/TableHarvest.vue'),
      },
      {
        path: 'treatment',
        name: 'table-treatment',
        component: () => import('~/pages/TableTreatment.vue'),
      },
      {
        path: 'checkup',
        name: 'table-checkup',
        component: () => import('~/pages/TableCheckup.vue'),
      },
      {
        path: 'charge',
        name: 'table-charge',
        component: () => import('~/pages/TableCharge.vue'),
      },
      {
        path: 'scale_data',
        name: 'table-scale_data',
        component: () => import('~/pages/TableScaleData.vue'),
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
        component: () => import('~/pages/NewQuicktool.vue'),
      },
      {
        path: 'queen',
        name: 'new-queen',
        component: () => import('~/pages/NewQueen.vue'),
      },
      {
        path: 'hive',
        name: 'new-hive',
        component: () => import('~/pages/NewHive.vue'),
      },
      {
        path: 'todo',
        name: 'new-todo',
        component: () => import('~/pages/NewTodo.vue'),
      },
      {
        path: 'movement',
        name: 'new-movement',
        component: () => import('~/pages/NewMovement.vue'),
      },
      {
        path: 'charge',
        name: 'new-charge',
        component: () => import('~/pages/NewCharge.vue'),
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
        component: () => import('~/pages/EditQuicktool.vue'),
      },
      {
        path: 'queen/:ids*',
        name: 'edit-queen',
        props: true,
        component: () => import('~/pages/EditQueen.vue'),
      },
      {
        path: 'todo/:ids*',
        name: 'edit-todo',
        props: true,
        component: () => import('~/pages/EditTodo.vue'),
      },
      {
        path: 'movement/:ids*',
        name: 'edit-movement',
        props: true,
        component: () => import('~/pages/EditMovement.vue'),
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
        path: 'option/:option',
        name: 'settingOption',
        props: true,
        component: () => import('~/pages/SettingOption.vue'),
      },
      {
        path: 'dropbox/:token?',
        name: 'settingDropbox',
        props: true,
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
