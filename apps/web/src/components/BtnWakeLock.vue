<template>
  <btn-base
    v-if="isSupported"
    flat
    dense
    color="white"
    size="md"
    :icon="isActive ? 'fas fa-eye' : 'far fa-eye'"
    @click="isActive ? release() : request('screen')"
  >
    <q-tooltip> {{ $t('keepAwake') }} {{ $t(isActive + '') }} </q-tooltip>
  </btn-base>
</template>

<script setup lang="ts">
import { useWakeLock } from '@vueuse/core';
const { isSupported, isActive, request, release } = useWakeLock();
</script>
