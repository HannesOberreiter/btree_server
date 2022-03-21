<template>
  <q-item>
    <q-item-section avatar>
      <q-icon :name="getPaidStatus.icon"></q-icon>
    </q-item-section>

    <q-item-section>
      {{ t('paid') }}: {{ getPaidStatus.date }}
      <br />
      {{ t('status') }}: {{ getPaidStatus.name }}
      <br />
      {{ t('rank') }}: {{ getPaidStatus.rank.name }}
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthUserStore } from '~/stores/auth';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const storeUser = useAuthUserStore();
const getPaidStatus = computed(() => {
  return storeUser.getPaidStatus;
});
</script>
