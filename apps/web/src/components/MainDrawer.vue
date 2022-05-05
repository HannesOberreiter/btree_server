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
        :content-inset-level="0.3"
        expand-separator
        :icon="link.icon"
        :label="$t(link.label, 2)"
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

<script lang="ts">
const calendar = {
  label: 'calendar.name',
  route: 'calendar',
  icon: 'far fa-calendar-alt',
};

const links = [
  {
    label: 'new',
    route: '',
    icon: 'fas fa-circle-plus',
    menu: [
      {
        label: 'todo',
        route: 'new-todo',
        icon: 'fas fa-clipboard-check',
        menu: false,
      },
      {
        label: 'hive',
        route: 'new-hive',
        icon: 'fas fa-house',
        menu: false,
      },
      {
        label: 'movement',
        route: 'new-movement',
        icon: 'fas fa-truck',
        menu: false,
      },
      {
        label: 'apiary',
        route: 'map-apiary',
        icon: 'fas fa-map-marker-alt',
        menu: false,
      },
      {
        label: 'queen',
        route: 'new-queen',
        icon: 'fas fa-venus',
        menu: false,
      },
      {
        label: 'charge',
        route: 'new-charge',
        icon: 'fas fa-database',
        menu: false,
      },
    ],
  },
  {
    label: 'map.name',
    route: '',
    icon: 'fas fa-globe',
    menu: [
      {
        label: 'apiary',
        route: 'map-apiary',
        icon: 'fas fa-map-marker-alt',
        menu: false,
      },
      {
        label: 'wind',
        route: 'map-wind',
        icon: 'fas fa-wind',
        menu: false,
      },
    ],
  },
  {
    label: 'table',
    route: '',
    icon: 'fas fa-table',
    menu: [
      {
        label: 'checkup',
        route: 'table-checkup',
        icon: 'fas fa-search-plus',
        menu: false,
      },
      {
        label: 'treatment',
        route: 'table-treatment',
        icon: 'fas fa-kit-medical',
        menu: false,
      },
      {
        label: 'harvest',
        route: 'table-harvest',
        icon: 'fas fa-droplet',
        menu: false,
      },
      {
        label: 'feed',
        route: 'table-feed',
        icon: 'fas fa-cube',
        menu: false,
      },
      {
        label: 'todo',
        route: 'table-todo',
        icon: 'fas fa-clipboard-check',
        menu: false,
      },

      {
        label: 'hive',
        route: 'table-hive',
        icon: 'fas fa-house',
        menu: false,
      },
      {
        label: 'movement',
        route: 'table-movement',
        icon: 'fas fa-truck',
        menu: false,
      },
      {
        label: 'apiary',
        route: 'table-apiary',
        icon: 'fas fa-location-dot',
        menu: false,
      },
      {
        label: 'queen',
        route: 'table-queen',
        icon: 'fas fa-venus',
        menu: false,
      },
      {
        label: 'charge',
        route: 'table-charge',
        icon: 'fas fa-database',
        menu: false,
      },
      {
        label: 'scale.name',
        route: 'table-scale_data',
        icon: 'fas fa-scale-balanced',
        menu: false,
      },
    ],
  },
  {
    label: 'rearing',
    route: '',
    icon: 'fas fa-sitemap',
    menu: [
      {
        label: 'new',
        route: 'new-rearing',
        icon: 'fas fa-circle-plus',
        menu: false,
      },
      {
        label: 'serie',
        route: 'table-rearing',
        icon: 'fas fa-table',
        menu: false,
      },
      {
        label: 'queen',
        route: 'table-queen',
        icon: 'fas fa-venus',
        menu: false,
      },
      {
        label: 'method',
        route: 'setting-rearing',
        icon: 'fas fa-cog',
        menu: false,
      },
    ],
  },
  {
    label: 'setting.name',
    route: '',
    icon: 'fas fa-cogs',
    menu: [
      {
        label: 'profile.name',
        route: 'setting-profile',
        icon: 'far fa-id-card',
        menu: [] as any,
      },
      {
        label: 'field',
        route: 'setting-field',
        icon: 'fas fa-cog',
        menu: [] as any,
      },
      {
        label: 'option',
        route: 'setting-option',
        icon: 'fas fa-cogs',
        menu: [] as any,
      },
      {
        label: 'company.name',
        route: 'setting-company',
        icon: 'fas fa-warehouse',
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
];
</script>

<script setup lang="ts">
import { useAuthUserStore } from '~/stores/auth';
import { useQuicktoolStore } from '~/stores/quicktool';

const storeUser = useAuthUserStore();
const storeQuicktool = useQuicktoolStore();

const onLogout = async () => {
  await storeUser.logout();
};
</script>
