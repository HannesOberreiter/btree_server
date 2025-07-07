<template>
  <!-- eslint-disable-next-line vue/no-undef-components -->
  <pwa-install
    manifest-url="/manifest.json"
    disable-chrome="true"
    use-local-storage="true"
  >
  </pwa-install>
</template>

<script setup lang="ts">
import '@khmyznikov/pwa-install';
// import { useInstallPWA } from 'src/composables/useInstallPwa';
</script>
