import type { RouteRecordRaw } from 'vue-router';
import { convertIdsToNumbers } from '@/helpers';
import MainLaylout from '../layouts/MainLayout.vue';
import VisitorLayout from '../layouts/VisitorLayout.vue';

const routes: RouteRecordRaw[] = [
  /***
    Path: /*
   */
  {
    path: '/',
    meta: {
      auth: true
    },
    component: MainLaylout,
    children: [
      {
        path: '',
        name: 'calendar',
        meta: {
          title: 'calendar'
        },
        component: () => import('../pages/CalendarMain.vue')
      },
      {
        path: 'calendar_scale',
        name: 'calendar-scale_data',
        meta: {
          title: 'scale.name'
        },
        component: () => import('../pages/CalendarScale.vue')
      },
      {
        path: '/news',
        name: 'news',
        meta: {
          title: 'news'
        },
        component: () => import('../pages/ChangeLog.vue')
      },
      {
        path: '/premium',
        name: 'premium',
        meta: {
          title: 'donation'
        },
        component: () => import('../pages/PremiumDonation.vue')
      },
      {
        path: '/lifecycle',
        name: 'lifecycle',
        meta: {
          title: 'lifecycle'
        },
        component: () => import('../pages/HelperLifecycle.vue')
      },
      {
        path: '/sugar_water_calculator',
        name: 'sugarwater',
        meta: {
          title: 'calculator'
        },
        component: () => import('../pages/HelperSugarWater.vue')
      },
      {
        path: '/beekeeping_news',
        name: 'beekeeping_news',
        meta: {
          title: 'beekeepingNews'
        },
        component: () => import('../pages/BeekeepingNews.vue')
      },
      {
        path: '/wizbee',
        name: 'wizbee',
        meta: {
          title: 'WizBee'
        },
        component: () => import('../pages/WizBee.vue')
      }
    ]
  },
  /***
    Path: /table/*
   */
  {
    path: '/table',
    meta: {
      auth: true
    },
    component: MainLaylout,
    children: [
      {
        path: 'hive',
        name: 'table-hive',
        meta: {
          title: 'hive'
        },
        component: () => import('../pages/TableHive.vue')
      },
      {
        path: 'queen',
        name: 'table-queen',
        meta: {
          title: 'queen'
        },
        component: () => import('../pages/TableQueen.vue')
      },
      {
        path: 'virgin',
        name: 'table-virgin',
        meta: {
          title: 'virgin'
        },
        component: () => import('../pages/TableVirgin.vue')
      },
      {
        path: 'apiary',
        name: 'table-apiary',
        meta: {
          title: 'apiary'
        },
        component: () => import('../pages/TableApiary.vue')
      },
      {
        path: 'movement',
        name: 'table-movement',
        meta: {
          title: 'movement'
        },
        component: () => import('../pages/TableMovement.vue')
      },
      {
        path: 'todo',
        name: 'table-todo',
        meta: {
          title: 'todo'
        },
        component: () => import('../pages/TableTodo.vue')
      },
      {
        path: 'feed',
        name: 'table-feed',
        meta: {
          title: 'feed'
        },
        component: () => import('../pages/TableFeed.vue')
      },
      {
        path: 'harvest',
        name: 'table-harvest',
        meta: {
          title: 'harvest'
        },
        component: () => import('../pages/TableHarvest.vue')
      },
      {
        path: 'treatment',
        name: 'table-treatment',
        component: () => import('../pages/TableTreatment.vue')
      },
      {
        path: 'checkup',
        name: 'table-checkup',
        meta: {
          title: 'checkup'
        },
        component: () => import('../pages/TableCheckup.vue')
      },
      {
        path: 'charge',
        name: 'table-charge',
        meta: {
          title: 'charge'
        },
        component: () => import('../pages/TableCharge.vue')
      },
      {
        path: 'charge-stock',
        name: 'table-charge-stock',
        meta: {
          title: 'stock'
        },
        component: () => import('../pages/TableChargeStock.vue')
      },
      {
        path: 'scale_data',
        name: 'table-scale_data',
        meta: {
          title: 'scale.name'
        },
        component: () => import('../pages/TableScaleData.vue')
      },
      {
        path: 'rearing',
        name: 'table-rearing',
        meta: {
          title: 'rearing'
        },
        component: () => import('../pages/TableRearing.vue')
      }
    ]
  },
  /***
    Path: /detail/*
   */
  {
    path: '/detail',
    meta: {
      auth: true
    },
    component: MainLaylout,
    children: [
      {
        path: 'hive/:id',
        props: true,
        name: 'detail-hive',
        meta: {
          title: 'hive'
        },
        component: () => import('../pages/DetailHive.vue')
      },
      {
        path: 'apiary/:id',
        props: true,
        name: 'detail-apiary',
        meta: {
          title: 'apiary'
        },
        component: () => import('../pages/DetailApiary.vue')
      }
    ]
  },
  /***
    Path: /new/*
   */
  {
    path: '/new',
    meta: {
      auth: true
    },
    component: MainLaylout,
    children: [
      {
        path: 'quicktool/:task',
        name: 'new-quicktool',
        props: true,
        meta: {
          title: 'quicktool.name'
        },
        component: () => import('../pages/NewQuicktool.vue')
      },
      {
        path: 'queen',
        name: 'new-queen',
        meta: {
          title: 'queen'
        },
        component: () => import('../pages/NewQueen.vue')
      },
      {
        path: 'hive',
        name: 'new-hive',
        meta: {
          title: 'hive'
        },
        component: () => import('../pages/NewHive.vue')
      },
      {
        path: 'todo',
        name: 'new-todo',
        meta: {
          title: 'todo'
        },
        component: () => import('../pages/NewTodo.vue')
      },
      {
        path: 'movement',
        name: 'new-movement',
        meta: {
          title: 'movement'
        },
        component: () => import('../pages/NewMovement.vue')
      },
      {
        path: 'charge',
        name: 'new-charge',
        meta: {
          title: 'charge'
        },
        component: () => import('../pages/NewCharge.vue')
      },
      {
        path: 'rearing',
        name: 'new-rearing',
        component: () => import('../pages/NewRearing.vue')
      }
    ]
  },
  /***
    Path: /edit/*
   */
  {
    path: '/edit',
    meta: {
      auth: true
    },
    component: MainLaylout,
    children: [
      {
        path: ':task/:ids*',
        name: 'edit-quicktool',
        props: true,
        meta: {
          title: 'quicktool.name'
        },
        component: () => import('../pages/EditQuicktool.vue')
      },
      {
        path: 'queen/:ids*',
        name: 'edit-queen',
        props: true,
        meta: {
          title: 'queen'
        },
        component: () => import('../pages/EditQueen.vue')
      },
      {
        path: 'todo/:ids*',
        name: 'edit-todo',
        props: route => ({ ids: convertIdsToNumbers(route.params.ids) }),
        meta: {
          title: 'todo'
        },
        component: () => import('../pages/EditTodo.vue')
      },
      {
        path: 'movement/:ids*',
        name: 'edit-movement',
        props: true,
        meta: {
          title: 'movement'
        },
        component: () => import('../pages/EditMovement.vue')
      }
    ]
  },
  /***
    Path: /visitor/*
   */
  {
    path: '/visitor',
    name: 'visitorTemplate',
    component: VisitorLayout,
    children: [
      {
        path: 'login',
        name: 'login',
        meta: {
          title: 'login'
        },
        component: () => import('../pages/VisitorLogin.vue')
      },
      {
        path: 'register',
        name: 'register',
        meta: {
          title: 'signup.name'
        },
        component: () => import('../pages/VisitorRegister.vue')
      },
      {
        path: 'recover',
        name: 'recover',
        meta: {
          title: 'recoverUser.title'
        },
        component: () => import('../pages/VisitorRecover.vue')
      },
      {
        path: 'reset/:reset',
        name: 'reset',
        props: true,
        meta: {
          title: 'resetUser.title'
        },
        component: () => import('../pages/VisitorReset.vue')
      },
      {
        path: 'activate/:activate',
        name: 'activate',
        props: true,
        meta: {
          title: 'activateUser.title'
        },
        component: () => import('../pages/VisitorActivate.vue')
      },
      {
        path: 'unsubscribe',
        name: 'unsubscribe',
        meta: {
          title: 'unsubscribe.name'
        },
        component: () => import('../pages/VisitorUnsubscribe.vue')
      },
      {
        path: 'forum',
        name: 'forum',
        meta: {
          title: 'forum'
        },
        component: () => import('../pages/VisitorForum.vue')
      }
    ]
  },
  /***
    Path: /map/*
   */
  {
    path: '/map',
    meta: {
      auth: true
    },
    component: MainLaylout,
    children: [
      {
        path: 'apiary',
        name: 'map-apiary',
        meta: {
          title: 'apiary'
        },
        component: () => import('../pages/MapApiary.vue')
      },
      {
        path: 'meteoblue',
        name: 'map-meteoblue',
        meta: {
          title: 'meteoblue'
        },
        component: () => import('../pages/MapMeteoblue.vue')
      },
      {
        path: 'vespa_velutina',
        name: 'map-velutina',
        meta: {
          title: 'Vespa velutina'
        },
        component: () => import('../pages/MapPest.vue')
      },
      {
        path: 'aethina_tumida',
        name: 'map-aethina-tumida',
        meta: {
          title: 'Aethina tunida'
        },
        component: () => import('../pages/MapPest.vue')
      }
    ]
  },
  /***
    Path: /setting/*
   */
  {
    path: '/setting',
    meta: {
      auth: true,
      title: 'setting.name'
    },
    component: MainLaylout,
    children: [
      {
        path: 'profile/:tab?',
        name: 'setting-profile',
        props: true,
        component: () => import('../pages/SettingProfile.vue')
      },
      {
        path: 'company/:tab?',
        name: 'setting-company',
        props: true,
        component: () => import('../pages/SettingCompany.vue')
      },
      {
        path: 'field/:tab?',
        name: 'setting-field',
        props: true,
        component: () => import('../pages/SettingField.vue')
      },
      {
        path: 'option/:option',
        name: 'setting-option',
        props: true,
        component: () => import('../pages/SettingOption.vue')
      },
      {
        path: 'dropbox/:token?',
        name: 'setting-dropbox',
        props: true,
        component: () => import('../pages/SettingDropbox.vue')
      },
      {
        path: 'rearing',
        name: 'setting-rearing',
        component: () => import('../pages/SettingRearing.vue')
      }
    ]
  },
  /***
    Path: /statistic/*
   */
  {
    path: '/statistic',
    meta: {
      auth: true,
      premium: true,
      title: 'statistic'
    },
    component: MainLaylout,
    children: [
      {
        path: 'hive_count',
        name: 'statistic-hive_count',
        component: () => import('../pages/StatisticHiveCount.vue')
      },
      {
        path: 'table_harvest',
        name: 'statistic-table_harvest',
        component: () => import('../pages/StatisticTableHarvest.vue')
      },
      {
        path: 'stats_harvest',
        name: 'statistic-stats_harvest',
        component: () => import('../pages/StatisticStatsHarvest.vue')
      },
      {
        path: 'table_feed',
        name: 'statistic-table_feed',
        component: () => import('../pages/StatisticTableFeed.vue')
      },
      {
        path: 'stats_feed',
        name: 'statistic-stats_feed',
        component: () => import('../pages/StatisticStatsFeed.vue')
      },
      {
        path: 'table_treatment',
        name: 'statistic-table_treatment',
        component: () => import('../pages/StatisticTableTreatment.vue')
      },
      {
        path: 'stats_treatment',
        name: 'statistic-stats_treatment',
        component: () => import('../pages/StatisticStatsTreatment.vue')
      },
      {
        path: 'table_rating',
        name: 'statistic-table_rating',
        component: () => import('../pages/StatisticTableRating.vue')
      },
      {
        path: 'table_queen',
        name: 'statistic-table_queen',
        component: () => import('../pages/StatisticTableQueen.vue')
      },
      {
        path: 'stats_scale',
        name: 'statistic-scale',
        component: () => import('../pages/StatisticScale.vue')
      },
      {
        path: 'stats_varroa',
        name: 'statistic-varroa',
        component: () => import('../pages/StatisticVarroa.vue')
      }
    ]
  },
  /***
    Path: /print/*
   */
  {
    path: '/print',
    meta: {
      auth: true
    },
    component: () => import('../layouts/PrintLayout.vue'),
    children: [
      {
        path: 'hive/:id/:year?',
        props: true,
        name: 'print-hive',
        meta: {
          title: 'hive'
        },
        component: () => import('../pages/PrintHive.vue')
      }
    ]
  },

  {
    path: '/pub/vespa-velutina/map/',
    name: 'public-map-velutina',
    meta: {
      auth: false,
      title: 'Vespa velutina'
    },
    component: () => import('../pages/PublicMapPest.vue')
  },

  {
    path: '/pub/aethina-tumida/map/',
    name: 'public-map-aethina-tumida',
    meta: {
      auth: false,
      title: 'Aethina tumida'
    },
    component: () => import('../pages/PublicMapPest.vue')
  },

  {
    path: '/pub/beekeeping-news/',
    name: 'public-beekeeping-news',
    meta: {
      auth: false,
      title: 'Beekeeping News'
    },
    component: () => import('../pages/PublicBeekeepingNews.vue')
  },

  /***
    Catch last 404
   */
  {
    path: '/:catchAll(.*)*',
    component: () => import('../pages/ErrorNotFound404.vue')
  }
];

export default routes;
