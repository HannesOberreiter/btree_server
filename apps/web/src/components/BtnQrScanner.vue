<template>
  <q-btn
    v-if="cameras.length > 0"
    flat
    dense
    size="md"
    class="q-mr-xs"
    icon="fas fa-qrcode"
    :aria-label="$t('qrScanner')"
    @click="onClick"
  >
    <tooltip-base anchor="bottom middle" self="top middle">
      {{ $t('qrScanner') }} (s)
    </tooltip-base>
  </q-btn>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import DialogQrScanner from './DialogQrScanner.vue';
import { useDevicesList } from '@vueuse/core';

const $q = useQuasar();
const { videoInputs: cameras } = useDevicesList();

function onClick() {
  $q.dialog({
    component: DialogQrScanner,
  });
}
</script>
