<template>
  <q-btn
    v-if="hasCamera"
    flat
    dense
    size="md"
    class="q-mr-xs"
    icon="fas fa-qrcode"
    @click="onClick"
  >
  </q-btn>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import DialogQrScanner from './DialogQrScanner.vue';
import QrScanner from 'qr-scanner';

const $q = useQuasar();
const hasCamera = ref(false);

onMounted(() =>
  QrScanner.hasCamera().then((value) => (hasCamera.value = value))
);

function onClick() {
  $q.dialog({
    component: DialogQrScanner,
  });
}
</script>
