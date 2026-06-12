<script setup lang="ts">
import '@khmyznikov/pwa-install';
// import { useInstallPWA } from '@/composables/useInstallPwa';
</script>

<template>
  <!-- eslint-disable-next-line vue/no-undef-components -->
  <pwa-install
    manifest-url="/manifest.json"
    disable-chrome="true"
    use-local-storage="true"
  />
</template>
