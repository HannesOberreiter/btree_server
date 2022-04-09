<template>
  <q-layout view="hhh LpR fff">
    <q-header class="bg-primary text-white print-hide">
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
      class="bg-blue-grey-9 print-hide"
    >
      <main-drawer></main-drawer>
    </q-drawer>

    <q-page-container>
      <div class="q-pa-xs">
        <router-view />
      </div>
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

const leftDrawerOpen = ref(false);
const storeUser = useAuthUserStore();
const $q = useQuasar();

storeUser.updateLang();
useQuasarLang($q);

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};
</script>
