<template>
  <q-layout view="hhh LpR lff">
    <q-header class="bg-primary text-white print-hide">
      <q-pull-to-refresh
        color="yellow-9"
        icon="fas fa-spinner"
        @refresh="refresh"
      >
        <q-toolbar>
          <btn-base
            dense
            flat
            round
            data-cy="btn-drawer"
            icon="fas fa-bars"
            aria-label="Toggle Sidebar"
            @click="toggleLeftDrawer"
          />
          <main-navbar></main-navbar>
        </q-toolbar>
      </q-pull-to-refresh>
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
      <div class="q-pa-xs">
        <router-view />
      </div>
      <q-page-scroller position="bottom" :scroll-offset="500" :offset="[0, 10]">
        <q-btn
          icon="fas fa-arrow-up"
          color="info"
          class="print-hide"
          round
          style="opacity: 0.6"
        />
      </q-page-scroller>
    </q-page-container>

    <q-footer class="bg-grey-8 text-white print-hide">
      <main-footer></main-footer>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { useAuthUserStore } from '../stores/auth';
import { useQuasar } from 'quasar';
import { useQuasarLang } from '../composables/useQuasarLang';
import MainDrawer from '../components/MainDrawer.vue';
import MainNavbar from '../components/MainNavbar.vue';
import MainFooter from '../components/MainFooter.vue';
import { useMeta } from 'quasar';
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';
import { usePreventNavigation } from '../composables/usePreventNavgiation';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { onMounted, ref, computed, watch } from 'vue';
import BtnBase from '../components/BtnBase.vue';
import { RouterView } from 'vue-router';

const usePrevent = usePreventNavigation();
const leftDrawerOpen = ref(false);
const storeUser = useAuthUserStore();
const $q = useQuasar();
const router = useRouter();
const { t } = useI18n();

storeUser.updateLang();
useQuasarLang($q);

useMeta(() => {
  return {
    title: router.currentRoute.value.meta.title
      ? t(router.currentRoute.value.meta.title as string) + ' - b.tree'
      : 'b.tree',
    meta: {
      robots: { name: 'robots', content: 'noindex,follow' },
    },
  };
});

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

onBeforeRouteLeave(() => {
  if (usePrevent.state.value) return usePrevent.blockMessage();
});
onBeforeRouteUpdate(() => {
  if (usePrevent.state.value) return usePrevent.blockMessage();
});
onMounted(() => {
  if (process.env.BACKEND_URL.indexOf('beta') >= 0) {
    $q.dialog({
      title: 'BETA Page',
      message:
        'You are on the beta server, this page is only meant for testing and your data is not saved here! You will not edit your live data if you edit any data on this server.',
    });
  }
});

const refresh = (done: () => void) => {
  window.location.reload();
  done();
};

// Matomo User Tracking
const _paq = ((window as any)._paq = (window as any)._paq || []);
const uniqueIdentifier = computed(() => {
  let identifier = '';
  if (storeUser?.user?.id) identifier += `bee_id:${storeUser.user.id}`;
  if (storeUser?.company?.id) identifier += `.user_id:${storeUser.company.id}`;
  return identifier;
});

watch(
  uniqueIdentifier,
  () => {
    if (uniqueIdentifier.value) {
      _paq.push(['setUserId', uniqueIdentifier.value]);
      _paq.push(['trackPageView']);
    } else {
      _paq.push(['resetUserId']);
      _paq.push(['trackPageView']);
    }
  },
  { immediate: true },
);
</script>
