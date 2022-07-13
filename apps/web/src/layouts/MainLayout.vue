<template>
  <q-layout view="hhh LpR fff">
    <q-header class="bg-primary text-white print-hide">
      <q-toolbar>
        <btn-base
          dense
          flat
          round
          data-cy="btn-drawer"
          icon="fas fa-bars"
          @click="toggleLeftDrawer"
        />
        <main-navbar></main-navbar>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      dark
      show-if-above
      side="left"
      :width="200"
      class="bg-blue-grey-9 print-hide"
      data-cy="drawer"
    >
      <main-drawer></main-drawer>
    </q-drawer>

    <q-page-container>
      <q-pull-to-refresh @refresh="onRefresh">
        <div class="q-pa-xs">
          <router-view />
        </div>
      </q-pull-to-refresh>
    </q-page-container>

    <q-footer class="bg-grey-8 text-white print-hide">
      <main-footer></main-footer>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { useAuthUserStore } from '~/stores/auth';
import { useQuasar } from 'quasar';
import { useQuasarLang } from '~/composables/useQuasarLang';
import MainDrawer from '~/components/MainDrawer.vue';
import MainNavbar from '~/components/MainNavbar.vue';
import MainFooter from '~/components/MainFooter.vue';
import { useMeta } from 'quasar';
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';
import { usePreventNavigation } from '~/composables/usePreventNavgiation';
import { clearCache } from '~/composables/useQuery';
import { useRefreshStore } from '~/stores/refresh';

const usePrevent = usePreventNavigation();
const leftDrawerOpen = ref(false);
const storeUser = useAuthUserStore();
const $q = useQuasar();
const router = useRouter();
const { t } = useI18n();

storeUser.updateLang();
useQuasarLang($q);
const storeRefresh = useRefreshStore();

useMeta(() => {
  return {
    title: router.currentRoute.value.meta.title
      ? t(router.currentRoute.value.meta.title as string) + ' - b.tree'
      : 'b.tree',
  };
});

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

const onRefresh = async () => {
  await storeRefresh.refresh();
  clearCache();
  window.location.reload();
};

onBeforeRouteLeave(() => {
  if (usePrevent.state.value) return usePrevent.blockMessage();
});
onBeforeRouteUpdate(() => {
  if (usePrevent.state.value) return usePrevent.blockMessage();
});
</script>
