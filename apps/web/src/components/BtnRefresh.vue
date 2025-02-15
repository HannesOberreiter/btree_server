<template>
  <q-item
    v-ripple
    clickable
    :class="storeRefresh.indicatorColor"
    @click="onRefresh"
  >
    <q-item-section avatar>
      <q-icon name="fas fa-sync" />
    </q-item-section>
    <q-item-section> {{ $t('refreshData') }} </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { clearCache } from '../composables/useQuery';
import { useRefreshStore } from '../stores/refresh';

const storeRefresh = useRefreshStore();
const $q = useQuasar();

const onRefresh = async () => {
  clearCache();
  await storeRefresh.refresh();
  window.location.reload();
};

defineExpose({ $q });
</script>
