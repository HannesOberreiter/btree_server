<template>
  <div class="row full-width items-center justify-between">
    <div class="col-1 col-sm-2 col-md-auto">
      <q-toolbar-title v-if="$q.screen.gt.xs" shrink>
        {{ company.name }}
      </q-toolbar-title>
    </div>
    <div class="col-4 col-sm-5 col-md-5 col-lg-4">
      <search-hive-apiary></search-hive-apiary>
    </div>

    <div class="col-6 col-sm-5 col-md-auto">
      <div class="q-gutter-md text-right">
        <btn-speak></btn-speak>
        <btn-wake-lock></btn-wake-lock>
        <btn-fullscreen></btn-fullscreen>
        <btn-dark-mode></btn-dark-mode>
        <btn-return></btn-return>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthUserStore } from '~/stores/auth';
const storeUser = useAuthUserStore();
const { company } = storeToRefs(storeUser);
</script>
