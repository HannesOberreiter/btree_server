<template>
  <btn-base
    v-if="wakeIsSupported"
    flat
    dense
    color="white"
    size="md"
    :icon="wakeIsActive ? 'fas fa-eye' : 'far fa-eye'"
    @click="wakeIsActive ? wakeRelease() : wakeRequest('screen')"
  >
    <q-tooltip> {{ $t('keepAwake') }} {{ $t(wakeIsActive + '') }} </q-tooltip>
  </btn-base>
</template>

<script setup lang="ts">
import { useWakeLock } from '@vueuse/core';
const {
  isSupported: wakeIsSupported,
  isActive: wakeIsActive,
  request: wakeRequest,
  release: wakeRelease,
} = useWakeLock();
</script>
