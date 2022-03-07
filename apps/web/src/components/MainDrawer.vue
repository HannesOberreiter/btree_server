<template>
  <q-scroll-area class="fit">
    <q-list>
      <template v-for="(link, index) in links" :key="index">
        <q-expansion-item
          :content-inset-level="0.3"
          v-if="link.menu.length > 0"
          expand-separator
          :icon="link.icon"
          :label="link.label"
          dark
        >
          <template v-for="(sublink, subindex) in link.menu" :key="subindex">
            <q-item
              clickable
              :to="{ name: sublink.route }"
              v-ripple
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
          clickable
          :to="{ name: link.route }"
          v-ripple
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
    </q-list>
    <div class="fixed-bottom">
      <btn-refresh></btn-refresh>
      <q-item>
        <q-item-section avatar>
          <q-icon :name="getPaidStatus.icon"></q-icon>
        </q-item-section>

        <q-item-section>
          {{ t('paid') }}: {{ getPaidStatus.date }}
          <br />
          {{ t('status') }}: {{ getPaidStatus.name }}
          <br />
          {{ t('rank') }}: {{ getPaidStatus.rank.name }}
        </q-item-section>
      </q-item>
      <q-item clickable v-ripple @click="onLogout">
        <q-item-section avatar>
          <q-icon name="fas fa-sign-out-alt" />
        </q-item-section>
        <q-item-section> {{ t('logout') }} </q-item-section>
      </q-item>
    </div>
  </q-scroll-area>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthUserStore } from 'src/stores/auth';
import { useI18n } from 'vue-i18n';
import BtnRefresh from './BtnRefresh.vue';

const { t } = useI18n();
const storeUser = useAuthUserStore();
const getPaidStatus = computed(() => {
  return storeUser.getPaidStatus;
});

const onLogout = async () => {
  await storeUser.logout();
};

const links = ref([
  {
    label: 'Calendar',
    route: 'calendar',
    icon: 'far fa-calendar-alt',
    menu: [] as any,
  },
  {
    label: 'Maps',
    route: '',
    icon: 'fas fa-globe',
    menu: [
      {
        label: 'Apiary',
        route: 'map-apiary',
        icon: 'fas fa-map-marker-alt',
        menu: false,
      },
      {
        label: 'Wind',
        route: 'map-wind',
        icon: 'fas fa-wind',
        menu: false,
      },
    ],
  },
  {
    label: 'Tables',
    route: '',
    icon: 'fas fa-table',
    menu: [
      {
        label: 'Apiaries',
        route: 'table-apiary',
        icon: 'fas fa-location-dot',
        menu: false,
      },
      {
        label: 'Checkups',
        route: 'table-checkup',
        icon: 'fas fa-search-plus',
        menu: false,
      },
    ],
  },
  {
    label: 'Settings',
    route: '',
    icon: 'fas fa-cogs',
    menu: [
      {
        label: 'Profile',
        route: 'settingProfile',
        icon: 'far fa-id-card',
        menu: [] as any,
      },
      {
        label: 'Fields',
        route: 'settingField',
        icon: 'fas fa-cog',
        menu: [] as any,
      },
      {
        label: 'Company',
        route: 'settingCompany',
        icon: 'fas fa-warehouse',
        menu: [] as any,
      },
    ],
  },
]);
</script>
