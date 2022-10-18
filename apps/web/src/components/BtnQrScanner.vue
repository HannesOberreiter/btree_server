<template>
  <q-btn
    v-if="isAvailable"
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
import { useScanner } from '~/composables/useScanner';

const $q = useQuasar();
const { isAvailable } = useScanner();

function onClick() {
  $q.dialog({
    component: DialogQrScanner,
  });
}
</script>
