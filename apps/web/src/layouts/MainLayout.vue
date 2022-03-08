<template>
  <q-layout view="hhh LpR fff">
    <q-header class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="fas fa-bars" @click="toggleLeftDrawer" />
        <main-navbar></main-navbar>
      </q-toolbar>
    </q-header>

    <q-drawer
      dark
      show-if-above
      v-model="leftDrawerOpen"
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
        Version: 5.X.X &nbsp;
        <router-link to="news" class="text-white">News</router-link>
        <q-space></q-space>
        <strong>b.tree</strong>
      </q-toolbar>
      <global-sound></global-sound>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { useAuthUserStore } from 'src/stores/auth';
import MainNavbar from 'src/components/MainNavbar.vue';
import MainDrawer from 'src/components/MainDrawer.vue';
import GlobalSound from 'src/components/GlobalSound.vue';
import { ref } from 'vue';

//import { useQuasar } from 'quasar';
const leftDrawerOpen = ref(false);
const storeUser = useAuthUserStore();
storeUser.updateLang();

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};
</script>
