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

<script>
import { ref } from 'vue';
import MainNavbar from 'src/components/MainNavbar.vue';
import MainDrawer from 'src/components/MainDrawer.vue';
import GlobalSound from 'src/components/GlobalSound.vue';
//import { useQuasar } from 'quasar';

export default {
  setup() {
    //const $q = useQuasar();
    const leftDrawerOpen = ref(false);
    /*
    Removed re-calculation of window as it broke fullcalendar
    const reCalc = computed(() => {
      if ($q.platform.is.mobile) return true;
      return leftDrawerOpen.value;
    });*/
    return {
      //reCalc,
      leftDrawerOpen,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value;
      },
    };
  },
  components: { MainNavbar, MainDrawer, GlobalSound },
};
</script>
