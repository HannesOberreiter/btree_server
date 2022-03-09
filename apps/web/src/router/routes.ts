import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    meta: {
      auth: true,
    },
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'calendar',
        component: () => import('pages/UserCalendar.vue'),
      },
      {
        path: '/map/apiary',
        name: 'map-apiary',
        component: () => import('pages/UserMapApiary.vue'),
      },
      {
        path: '/map/wind',
        name: 'map-wind',
        component: () => import('pages/UserMapWind.vue'),
      },
      {
        path: '/setting/profile/:tab?',
        name: 'settingProfile',
        props: true,
        component: () => import('src/pages/UserSettingProfile.vue'),
      },
      {
        path: '/setting/company/:tab?',
        name: 'settingCompany',
        props: true,
        component: () => import('src/pages/UserSettingCompany.vue'),
      },
      {
        path: '/setting/field',
        name: 'settingField',
        component: () => import('src/pages/UserSettingField.vue'),
      },
      {
        path: '/news',
        name: 'news',
        component: () => import('pages/NewsTable.vue'),
      },
    ],
  },
  {
    path: '/visitor',
    name: 'visitorTemplate',
    component: () => import('layouts/VisitorLayout.vue'),
    children: [
      {
        path: '/login',
        name: 'login',
        props: true,
        component: () => import('src/pages/VisitorLogin.vue'),
      },
      {
        path: '/register',
        name: 'register',
        component: () => import('src/pages/VisitorRegister.vue'),
      },
      {
        path: '/recover',
        name: 'recover',
        component: () => import('src/pages/VisitorRecover.vue'),
      },
      {
        path: '/reset/:reset',
        name: 'reset',
        props: true,
        component: () => import('src/pages/VisitorReset.vue'),
      },
      {
        path: '/activate/:activate',
        name: 'activate',
        props: true,
        component: () => import('src/pages/VisitorActivate.vue'),
      },
      {
        path: '/unsubscribe',
        name: 'unsubscribe',
        component: () => import('src/pages/VisitorUnsubscribe.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue'),
  },
];

export default routes;
