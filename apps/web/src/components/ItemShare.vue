<template>
  <div style="cursor: pointer" @click="onShare">
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
import DialogShare from './DialogShare.vue';

const $q = useQuasar();
const router = useRouter();
function onShare() {
  $q.dialog({
    component: DialogShare,
    componentProps: {
      url: window.location.href,
    },
  });
}
</script>
