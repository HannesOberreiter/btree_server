<template>
  <q-btn
    v-if="nfc.isSupported"
    flat
    class="q-mr-xs"
    :color="nfc.state.reading ? 'green' : 'grey'"
    icon="fab fa-nfc-symbol"
    @click="nfc.state.reading ? nfc.abort() : nfc.read()"
  >
  </q-btn>
  <div
    v-if="showPath"
    style="cursor: pointer"
    data-cy="btn-share"
    @click="onShare"
  >
    <span v-if="$q.platform.is.mobile">
      {{ $t('share') }}
    </span>
    <span v-else>
      {{ $t('path') }}: {{ router.currentRoute.value.fullPath }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useNFC } from '~/composables/useNFC';
import DialogShare from './DialogShare.vue';

const $q = useQuasar();
const router = useRouter();
const nfc = useNFC();

defineProps({
  showPath: {
    default: true,
  },
});

function onShare() {
  $q.dialog({
    component: DialogShare,
    componentProps: {
      url: window.location.href,
    },
  });
}
</script>
