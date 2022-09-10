<template>
  <btn-base
    v-if="!$q.platform.is.mobile"
    flat
    dense
    color="white"
    size="md"
    data-cy="btn-fullscreen"
    :icon="isFullscreen ? 'fas fa-compress' : 'fas fa-expand'"
    :aria-label="$t('fullscreen')"
    @click="toggle()"
  >
    <tooltip-base anchor="bottom middle" self="top middle">
      {{ $t('fullscreen') }}
    </tooltip-base>
  </btn-base>
</template>

<script setup lang="ts">
import { useFullscreen } from '@vueuse/core';
const { isFullscreen, toggle } = useFullscreen();
</script>
