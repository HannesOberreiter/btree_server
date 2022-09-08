<template>
  <q-btn flat class="q-mr-xs" icon="fas fa-qrcode" @click="onShare"> </q-btn>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import DialogQrScanner from './DialogQrScanner.vue';

const $q = useQuasar();

function onShare() {
  $q.dialog({
    component: DialogQrScanner,
  });
}
</script>
