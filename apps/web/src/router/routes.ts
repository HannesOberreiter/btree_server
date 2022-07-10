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
        meta: {
          title: 'calendar.name',
        },
        component: () => import('~/pages/CalendarMain.vue'),
      },
      {
        path: 'calendar_scale',
        name: 'calendar-scale_data',
        meta: {
          title: 'scale.name',
        },
        component: () => import('~/pages/CalendarScale.vue'),
      },
      {
        path: '/news',
        name: 'news',
        meta: {
          title: 'news',
        },
        component: () => import('~/pages/ChangeLog.vue'),
      },
      {
        path: '/premium',
        name: 'premium',
        meta: {
          title: 'donation',
        },
        component: () => import('~/pages/PremiumDonation.vue'),
      },
      {
        path: '/lifecycle',
        name: 'lifecycle',
        meta: {
          title: 'lifecycle',
        },
        component: () => import('~/pages/HelperLifecycle.vue'),
      },
      {
        path: '/sugar_water_calculator',
        name: 'sugarwater',
        meta: {
          title: 'calculator',
        },
        component: () => import('~/pages/HelperSugarWater.vue'),
      },
      {
        path: '/links',
        name: 'links',
        meta: {
          title: 'curatedLinks',
        },
        component: () => import('~/pages/HelperLinks.vue'),
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
        meta: {
          title: 'hive',
        },
        component: () => import('~/pages/TableHive.vue'),
      },
      {
        path: 'queen',
        name: 'table-queen',
        meta: {
          title: 'queen',
        },
        component: () => import('~/pages/TableQueen.vue'),
      },
      {
        path: 'virgin',
        name: 'table-virgin',
        meta: {
          title: 'virgin',
        },
        component: () => import('~/pages/TableVirgin.vue'),
      },
      {
        path: 'apiary',
        name: 'table-apiary',
        meta: {
          title: 'apiary',
        },
        component: () => import('~/pages/TableApiary.vue'),
      },
      {
        path: 'movement',
        name: 'table-movement',
        meta: {
          title: 'movement',
        },
        component: () => import('~/pages/TableMovement.vue'),
      },
      {
        path: 'todo',
        name: 'table-todo',
        meta: {
          title: 'todo',
        },
        component: () => import('~/pages/TableTodo.vue'),
      },
      {
        path: 'feed',
        name: 'table-feed',
        meta: {
          title: 'feed',
        },
        component: () => import('~/pages/TableFeed.vue'),
      },
      {
        path: 'harvest',
        name: 'table-harvest',
        meta: {
          title: 'harvest',
        },
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
        meta: {
          title: 'checkup',
        },
        component: () => import('~/pages/TableCheckup.vue'),
      },
      {
        path: 'charge',
        name: 'table-charge',
        meta: {
          title: 'charge',
        },
        component: () => import('~/pages/TableCharge.vue'),
      },
      {
        path: 'scale_data',
        name: 'table-scale_data',
        meta: {
          title: 'scale.name',
        },
        component: () => import('~/pages/TableScaleData.vue'),
      },
      {
        path: 'rearing',
        name: 'table-rearing',
        meta: {
          title: 'rearing',
        },
        component: () => import('~/pages/TableRearing.vue'),
      },
    ],
  },
  /***
    Path: /detail/*
   */
  {
    path: '/detail',
    meta: {
      auth: true,
    },
    component: () => import('~/layouts/MainLayout.vue'),
    children: [
      {
        path: 'hive/:id',
        props: true,
        name: 'detail-hive',
        meta: {
          title: 'hive',
        },
        component: () => import('~/pages/DetailHive.vue'),
      },
      {
        path: 'apiary/:id',
        props: true,
        name: 'detail-apiary',
        meta: {
          title: 'apiary',
        },
        component: () => import('~/pages/DetailApiary.vue'),
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
        meta: {
          title: 'quicktool.name',
        },
        component: () => import('~/pages/NewQuicktool.vue'),
      },
      {
        path: 'queen',
        name: 'new-queen',
        meta: {
          title: 'queen',
        },
        component: () => import('~/pages/NewQueen.vue'),
      },
      {
        path: 'hive',
        name: 'new-hive',
        meta: {
          title: 'hive',
        },
        component: () => import('~/pages/NewHive.vue'),
      },
      {
        path: 'todo',
        name: 'new-todo',
        meta: {
          title: 'todo',
        },
        component: () => import('~/pages/NewTodo.vue'),
      },
      {
        path: 'movement',
        name: 'new-movement',
        meta: {
          title: 'movement',
        },
        component: () => import('~/pages/NewMovement.vue'),
      },
      {
        path: 'charge',
        name: 'new-charge',
        meta: {
          title: 'charge',
        },
        component: () => import('~/pages/NewCharge.vue'),
      },
      {
        path: 'rearing',
        name: 'new-rearing',
        component: () => import('~/pages/NewRearing.vue'),
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
        meta: {
          title: 'quicktool.name',
        },
        component: () => import('~/pages/EditQuicktool.vue'),
      },
      {
        path: 'queen/:ids*',
        name: 'edit-queen',
        props: true,
        meta: {
          title: 'queen',
        },
        component: () => import('~/pages/EditQueen.vue'),
      },
      {
        path: 'todo/:ids*',
        name: 'edit-todo',
        props: true,
        meta: {
          title: 'todo',
        },
        component: () => import('~/pages/EditTodo.vue'),
      },
      {
        path: 'movement/:ids*',
        name: 'edit-movement',
        props: true,
        meta: {
          title: 'movement',
        },
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
        meta: {
          title: 'login',
        },
        component: () => import('~/pages/VisitorLogin.vue'),
      },
      {
        path: 'register',
        name: 'register',
        meta: {
          title: 'signup.name',
        },
        component: () => import('~/pages/VisitorRegister.vue'),
      },
      {
        path: 'recover',
        name: 'recover',
        meta: {
          title: 'recoverUser.title',
        },
        component: () => import('~/pages/VisitorRecover.vue'),
      },
      {
        path: 'reset/:reset',
        name: 'reset',
        props: true,
        meta: {
          title: 'resetUser.title',
        },
        component: () => import('~/pages/VisitorReset.vue'),
      },
      {
        path: 'activate/:activate',
        name: 'activate',
        props: true,
        meta: {
          title: 'activateUser.title',
        },
        component: () => import('~/pages/VisitorActivate.vue'),
      },
      {
        path: 'unsubscribe',
        name: 'unsubscribe',
        meta: {
          title: 'unsubscribe.name',
        },
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
        meta: {
          title: 'apiary',
        },
        component: () => import('~/pages/MapApiary.vue'),
      },
      {
        path: 'wind',
        name: 'map-wind',
        meta: {
          title: 'wind',
        },
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
      title: 'setting.name',
    },
    component: () => import('~/layouts/MainLayout.vue'),
    children: [
      {
        path: 'profile/:tab?',
        name: 'setting-profile',
        props: true,
        component: () => import('~/pages/SettingProfile.vue'),
      },
      {
        path: 'company/:tab?',
        name: 'setting-company',
        props: true,
        component: () => import('~/pages/SettingCompany.vue'),
      },
      {
        path: 'field',
        name: 'setting-field',
        component: () => import('~/pages/SettingField.vue'),
      },
      {
        path: 'option/:option',
        name: 'setting-option',
        props: true,
        component: () => import('~/pages/SettingOption.vue'),
      },
      {
        path: 'dropbox/:token?',
        name: 'setting-dropbox',
        props: true,
        component: () => import('~/pages/SettingDropbox.vue'),
      },
      {
        path: 'rearing',
        name: 'setting-rearing',
        props: true,
        component: () => import('~/pages/SettingRearing.vue'),
      },
    ],
  },
  /***
    Path: /statistic/*
   */
  {
    path: '/statistic',
    meta: {
      auth: true,
      premium: true,
      title: 'statistic',
    },
    component: () => import('~/layouts/MainLayout.vue'),
    children: [
      {
        path: 'hive_count',
        name: 'statistic-hive_count',
        component: () => import('~/pages/StatisticHiveCount.vue'),
      },
    ],
  },

  /***
    Catch last 404
   */
  {
    path: '/:catchAll(.*)*',
    component: () => import('~/pages/ErrorNotFound404.vue'),
  },
];

export default routes;
