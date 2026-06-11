<script setup lang="ts">
import { useWakeLock } from '@vueuse/core';
import BtnBase from './BtnBase.vue';
import TooltipBase from './TooltipBase.vue';

const { isSupported, isActive, request, release } = useWakeLock();
</script>

<template>
  <BtnBase
    v-if="isSupported"
    flat
    dense
    color="white"
    size="md"
    :icon="isActive ? 'fas fa-eye' : 'far fa-eye'"
    :aria-label="$t('keepAwake')"
    @click="isActive ? release() : request('screen')"
  >
    <TooltipBase anchor="bottom middle" self="top middle">
      {{ $t('keepAwake') }} {{ $t(`${isActive}`) }}
    </TooltipBase>
  </BtnBase>
</template>
