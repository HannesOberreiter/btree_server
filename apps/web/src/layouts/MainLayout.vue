<template>
  <q-layout view="hhh LpR fff">
    <q-header class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="fas fa-bars" @click="toggleLeftDrawer" />
        <main-navbar></main-navbar>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      dark
      show-if-above
      side="left"
      :width="200"
      class="bg-blue-grey-9"
    >
      <main-drawer></main-drawer>
    </q-drawer>

    <q-page-container>
      <div class="q-pa-xs">
        <router-view />
      </div>
    </q-page-container>

    <q-footer class="bg-grey-8 text-white">
      <q-toolbar dense style="max-height: 30px; min-height: 30px">
        Version: {{ news.aaData[0].version }}, {{ news.aaData[0].date }} &nbsp;
        <router-link :to="{ name: 'news' }" class="text-white">
          {{ t('news') }}
        </router-link>
        <q-space></q-space>
        <strong>b.tree</strong>
      </q-toolbar>
      <global-sound></global-sound>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthUserStore } from '~/stores/auth';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useQuasarLang } from '~/composables/useQuasarLang';
import GlobalSound from '~/components/GlobalSound.vue';
import MainDrawer from '~/components/MainDrawer.vue';
import MainNavbar from '~/components/MainNavbar.vue';
import news from '~/assets/news.json';

const leftDrawerOpen = ref(false);
const storeUser = useAuthUserStore();
const $q = useQuasar();
const { t } = useI18n();

storeUser.updateLang();
useQuasarLang($q);

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};
</script>
