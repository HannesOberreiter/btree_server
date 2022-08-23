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
    <tooltip-base anchor="bottom middle" self="top middle">
      {{ $t('keepAwake') }} {{ $t(isActive + '') }}
    </tooltip-base>
  </btn-base>
</template>

<script setup lang="ts">
import { useWakeLock } from '@vueuse/core';
const { isSupported, isActive, request, release } = useWakeLock();
</script>
