<template>
  <q-item>
    <q-item-section avatar>
      <q-icon :name="getPaidStatus.icon"></q-icon>
    </q-item-section>

    <q-item-section>
      {{ $t('paid') }}: {{ getPaidStatus.date }}
      <br />
      {{ $t('status') }}: {{ getPaidStatus.name }}
      <br />
      {{ $t('rank') }}: {{ getPaidStatus.rank.name }}
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { useAuthUserStore } from '~/stores/auth';
const storeUser = useAuthUserStore();
const getPaidStatus = computed(() => {
  return storeUser.getPaidStatus;
});
</script>
