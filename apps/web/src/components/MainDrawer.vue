<template>
  <q-scroll-area class="fit">
    <q-list>
      <template v-for="(link, _index) in links" :key="_index">
        <q-expansion-item
          v-if="link.menu.length > 0"
          :content-inset-level="0.3"
          expand-separator
          :icon="link.icon"
          :label="link.label"
          dark
        >
          <template v-for="(sublink, _subindex) in link.menu" :key="_subindex">
            <q-item
              v-ripple
              clickable
              :to="{ name: sublink.route }"
              exact
              active-class="text-yellow"
            >
              <q-item-section avatar>
                <q-icon :name="sublink.icon" />
              </q-item-section>
              <q-item-section>
                {{ sublink.label }}
              </q-item-section>
            </q-item>
          </template>
        </q-expansion-item>

        <q-item
          v-else
          v-ripple
          clickable
          :to="{
            name: link.route,
            params: {
              task:
                link.route === 'new-quicktool' ? storeQuicktool.getLink : '',
              ids: null,
            },
          }"
          exact
          active-class="text-yellow"
        >
          <q-item-section avatar>
            <q-icon :name="link.icon" />
          </q-item-section>
          <q-item-section>
            {{ link.label }}
          </q-item-section>
        </q-item>
      </template>
      <btn-refresh></btn-refresh>
      <item-company></item-company>
      <q-item v-ripple clickable @click="onLogout">
        <q-item-section avatar>
          <q-icon name="fas fa-sign-out-alt" />
        </q-item-section>
        <q-item-section> {{ t('logout') }} </q-item-section>
      </q-item>
    </q-list>
  </q-scroll-area>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthUserStore } from '~/stores/auth';
import { useI18n } from 'vue-i18n';
import BtnRefresh from './BtnRefresh.vue';
import ItemCompany from './ItemCompany.vue';
import { useQuicktoolStore } from '~/stores/quicktool';

const { t } = useI18n();
const storeUser = useAuthUserStore();
const storeQuicktool = useQuicktoolStore();

const onLogout = async () => {
  await storeUser.logout();
};

const links = ref([
  {
    label: t('calendar.name'),
    route: 'calendar',
    icon: 'far fa-calendar-alt',
    menu: [] as any,
  },
  {
    label: t('quicktool.name'),
    route: 'new-quicktool',
    icon: 'fas fa-magic',
    menu: [] as any,
  },
  {
    label: t('new', 2),
    route: '',
    icon: 'fas fa-circle-plus',
    menu: [
      {
        label: t('hive'),
        route: 'new-hive',
        icon: 'fas fa-house',
        menu: false,
      },
      {
        label: t('queen'),
        route: 'new-queen',
        icon: 'fas fa-venus',
        menu: false,
      },
      {
        label: t('apiary'),
        route: 'map-apiary',
        icon: 'fas fa-map-marker-alt',
        menu: false,
      },
      {
        label: t('movement'),
        route: 'new-movement',
        icon: 'fas fa-truck',
        menu: false,
      },
      {
        label: t('todo'),
        route: 'new-todo',
        icon: 'fas fa-clipboard-check',
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
        label: t('apiary', 2),
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
    label: t('table', 2),
    route: '',
    icon: 'fas fa-table',
    menu: [
      {
        label: t('apiary', 2),
        route: 'table-apiary',
        icon: 'fas fa-location-dot',
        menu: false,
      },
      {
        label: t('hive', 2),
        route: 'table-apiary',
        icon: 'fas fa-house',
        menu: false,
      },
      {
        label: t('movement', 2),
        route: 'table-table',
        icon: 'fas fa-truck',
        menu: false,
      },
      {
        label: t('checkup', 2),
        route: 'table-checkup',
        icon: 'fas fa-search-plus',
        menu: false,
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
        route: 'settingProfile',
        icon: 'far fa-id-card',
        menu: [] as any,
      },
      {
        label: t('field', 2),
        route: 'settingField',
        icon: 'fas fa-cog',
        menu: [] as any,
      },
      {
        label: t('company.name'),
        route: 'settingCompany',
        icon: 'fas fa-warehouse',
        menu: [] as any,
      },
      {
        label: 'Dropbox',
        route: 'settingDropbox',
        icon: 'fab fa-dropbox',
        menu: [] as any,
      },
    ],
  },
]);
</script>
