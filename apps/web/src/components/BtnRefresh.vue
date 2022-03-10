<template>
  <q-item
    clickable
    v-ripple
    @click="onRefresh"
    :class="storeRefresh.indicatorColor"
  >
    <q-item-section avatar>
      <q-icon name="fas fa-sync" />
    </q-item-section>
    <q-item-section> {{ t('refreshData') }} </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { clearCache } from 'src/query';
import { useI18n } from 'vue-i18n';
import { useRefreshStore } from '../stores/refresh';

const storeRefresh = useRefreshStore();

const onRefresh = async () => {
  await storeRefresh.refresh();
  clearCache();
};
const { t } = useI18n();
</script>
