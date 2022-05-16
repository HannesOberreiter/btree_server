<template>
  <btn-base
    v-if="!$q.platform.is.mobile"
    flat
    dense
    color="white"
    size="md"
    :icon="isFullscreen ? 'fas fa-compress' : 'fas fa-expand'"
    @click="toggle()"
  />
</template>

<script setup lang="ts">
import { useFullscreen } from '@vueuse/core';
const { isFullscreen, toggle } = useFullscreen();
</script>
