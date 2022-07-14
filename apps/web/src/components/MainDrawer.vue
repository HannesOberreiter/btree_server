<template>
  <q-scroll-area class="fit">
    <q-list>
      <drawer-item :link="calendar"></drawer-item>
      <q-item
        v-ripple
        :to="{
          name: 'new-quicktool',
          params: {
            task: storeQuicktool.getLink,
          },
        }"
        data-cy="route-new-quicktool"
        clickable
        exact
        active-class="text-yellow"
      >
        <q-item-section avatar>
          <q-icon name="fas fa-magic" />
        </q-item-section>
        <q-item-section>
          {{ $t('quicktool.name') }}
        </q-item-section>
      </q-item>
      <q-expansion-item
        v-for="(link, index) in links"
        :key="index"
        group="sidebar"
        :content-inset-level="0.3"
        expand-separator
        :icon="link.icon"
        :label="link.label"
        :disable="link.route === 'premium' && !storeUser.isPremium"
        :caption="
          link.route === 'premium' && !storeUser.isPremium ? $t('premium') : ''
        "
        dark
      >
        <drawer-item
          v-for="(sublink, subindex) in link.menu"
          :key="subindex"
          :link="sublink"
        ></drawer-item>
      </q-expansion-item>
      <btn-refresh></btn-refresh>
      <item-company></item-company>
      <item-ping></item-ping>
      <q-item v-ripple clickable @click="onLogout">
        <q-item-section avatar>
          <q-icon name="fas fa-sign-out-alt" />
        </q-item-section>
        <q-item-section> {{ $t('logout') }} </q-item-section>
      </q-item>
    </q-list>
  </q-scroll-area>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useAuthUserStore } from '~/stores/auth';
import { useQuicktoolStore } from '~/stores/quicktool';

const { t } = useI18n();
const storeUser = useAuthUserStore();
const storeQuicktool = useQuicktoolStore();
const $q = useQuasar();

const onLogout = async () => {
  await storeUser.logout();
};

defineExpose({ $q });

const calendar = {
  label: t('calendar.name'),
  route: 'calendar',
  icon: 'far fa-calendar-alt',
};

const links = [
  {
    label: t('task', 2),
    route: '',
    icon: 'fas fa-table',
    menu: [
      {
        label: t('checkup', 2),
        route: 'table-checkup',
        icon: 'fas fa-search-plus',
        menu: false,
      },
      {
        label: t('treatment', 2),
        route: 'table-treatment',
        icon: 'fas fa-kit-medical',
        menu: false,
      },
      {
        label: t('harvest', 2),
        route: 'table-harvest',
        icon: 'fas fa-droplet',
        menu: false,
      },
      {
        label: t('feed', 2),
        route: 'table-feed',
        icon: 'fas fa-cube',
        menu: false,
      },
    ],
  },
  {
    label: t('colony', 2),
    route: '',
    icon: 'fas fa-house',
    menu: [
      {
        label: `${t('add')} ${t('hive')}`,
        route: 'new-hive',
        icon: 'fas fa-house',
        menu: false,
      },
      {
        label: t('hive', 2),
        route: 'table-hive',
        icon: 'fas fa-table',
        menu: false,
      },
      {
        label: `${t('add')} ${t('movement')}`,
        route: 'new-movement',
        icon: 'fas fa-truck',
        menu: false,
      },
      {
        label: t('movement', 2),
        route: 'table-movement',
        icon: 'fas fa-table',
        menu: false,
      },
      {
        label: t('apiary') + ' ' + t('map.name'),
        route: 'map-apiary',
        icon: 'fas fa-map-marker-alt',
        menu: false,
      },
      {
        label: t('apiary', 2),
        route: 'table-apiary',
        icon: 'fas fa-table',
        menu: false,
      },
    ],
  },
  {
    label: t('queen', 2),
    route: '',
    icon: 'fas fa-venus',
    menu: [
      {
        label: t('add'),
        route: 'new-queen',
        icon: 'fas fa-circle-plus',
        menu: false,
      },
      {
        label: t('queen', 2),
        route: 'table-queen',
        icon: 'fas fa-table',
        menu: false,
      },
      {
        label: t('virgin', 2),
        route: 'table-virgin',
        icon: 'fas fa-table',
        menu: false,
      },
    ],
  },
  {
    label: t('rearing'),
    route: '',
    icon: 'fas fa-sitemap',
    menu: [
      {
        label: t('add'),
        route: 'new-rearing',
        icon: 'fas fa-circle-plus',
        menu: false,
      },
      {
        label: t('serie'),
        route: 'table-rearing',
        icon: 'fas fa-table',
        menu: false,
      },
      {
        label: t('method'),
        route: 'setting-rearing',
        icon: 'fas fa-cog',
        menu: false,
      },
    ],
  },
  {
    label: t('todo', 2),
    route: '',
    icon: 'fas fa-clipboard-check',
    menu: [
      {
        label: t('add'),
        route: 'new-todo',
        icon: 'fas fa-circle-plus',
        menu: false,
      },
      {
        label: t('todo', 2),
        route: 'table-todo',
        icon: 'fas fa-table',
        menu: false,
      },
    ],
  },
  {
    label: t('charge', 2),
    route: '',
    icon: 'fas fa-database',
    menu: [
      {
        label: t('add'),
        route: 'new-charge',
        icon: 'fas fa-circle-plus',
        menu: false,
      },
      {
        label: t('table'),
        route: 'table-charge',
        icon: 'fas fa-table',
        menu: false,
      },
    ],
  },
  {
    label: t('map.name', 2),
    route: '',
    icon: 'fas fa-globe',
    menu: [
      {
        label: t('apiary'),
        route: 'map-apiary',
        icon: 'fas fa-map-marker-alt',
        menu: false,
      },
      {
        label: t('wind'),
        route: 'map-wind',
        icon: 'fas fa-wind',
        menu: false,
      },
    ],
  },
  {
    label: t('scale.name', 2),
    route: '',
    icon: 'fas fa-scale-balanced',
    menu: [
      {
        label: t('calendar.name'),
        route: 'calendar-scale_data',
        icon: 'fas fa-calendar-alt',
        menu: false,
      },
      {
        label: t('table'),
        route: 'table-scale_data',
        icon: 'fas fa-table',
        menu: false,
      },
      {
        label: t('api'),
        route: 'setting-profile',
        params: { tab: 'api' },
        icon: 'fas fa-cogs',
        menu: [] as any,
      },
    ],
  },
  {
    label: t('setting.name', 2),
    route: '',
    icon: 'fas fa-cogs',
    menu: [
      {
        label: t('profile.name'),
        route: 'setting-profile',
        icon: 'far fa-id-card',
        menu: [] as any,
      },
      {
        label: t('field', 2),
        route: 'setting-field',
        icon: 'fas fa-cog',
        menu: [] as any,
      },
      {
        label: t('option', 2),
        route: 'setting-option',
        icon: 'fas fa-cogs',
        params: { option: 'checkup_types' },
        menu: [] as any,
      },
      {
        label: t('company.name'),
        route: 'setting-company',
        icon: 'fas fa-warehouse',
        menu: [] as any,
      },
      {
        label: t('premium'),
        route: 'premium',
        icon: 'fas fa-face-smile',
        menu: [] as any,
      },
      {
        label: 'Dropbox',
        route: 'setting-dropbox',
        icon: 'fab fa-dropbox',
        menu: [] as any,
      },
    ],
  },
  {
    label: t('tool', 2),
    route: '',
    icon: 'fas fa-screwdriver',
    menu: [
      {
        label: t('lifecycle'),
        route: 'lifecycle',
        icon: 'fas fa-arrows-spin',
        menu: [] as any,
      },
      {
        label: t('sugarwater'),
        route: 'sugarwater',
        icon: 'fas fa-calculator',
        menu: [] as any,
      },
      {
        label: t('curatedLinks'),
        route: 'links',
        icon: 'fas fa-link',
        menu: [] as any,
      },
    ],
  },
  {
    label: t('statistic', 2),
    route: 'premium',
    icon: 'fas fa-chart-bar',
    menu: [
      {
        label: t('hiveCount'),
        route: 'statistic-hive_count',
        icon: 'fas fa-house',
        menu: [] as any,
      },
      {
        label: t('harvest') + ' ' + t('hive', 1),
        route: 'statistic-table_harvest',
        icon: 'fas fa-table',
        menu: [] as any,
      },
      {
        label: t('harvest') + ' ' + t('statistic'),
        route: 'statistic-stats_harvest',
        icon: 'fas fa-chart-simple',
        menu: [] as any,
      },
      {
        label: t('feed') + ' ' + t('hive', 1),
        route: 'statistic-table_feed',
        icon: 'fas fa-table',
        menu: [] as any,
      },
      {
        label: t('feed') + ' ' + t('statistic'),
        route: 'statistic-stats_feed',
        icon: 'fas fa-chart-simple',
        menu: [] as any,
      },
      {
        label: t('treatment') + ' ' + t('hive', 1),
        route: 'statistic-table_treatment',
        icon: 'fas fa-table',
        menu: [] as any,
      },
      {
        label: t('treatment') + ' ' + t('statistic'),
        route: 'statistic-stats_treatment',
        icon: 'fas fa-chart-simple',
        menu: [] as any,
      },
      {
        label: t('rating.name') + ' ' + t('hive', 1),
        route: 'statistic-table_rating',
        icon: 'fas fa-table',
        menu: [] as any,
      },
    ],
  },
];
</script>

<style>
.q-item__section--avatar {
  min-width: 10px !important;
}
</style>
