<script setup lang="ts">
import { RouterView } from 'vue-router';
import GlobalPWA from './components/GlobalPWA.vue';

// A deploy prunes the chunks of old versions. When a chunk fails to load,
// reload to get the current version. At most one reload per minute, so a
// chunk that stays unavailable shows the error instead of a reload loop.
const preloadReloadKey = 'preload-error-reload';
window.addEventListener('vite:preloadError', event => {
  console.warn('PreloadError', event.payload);
  const lastReload = Number(sessionStorage.getItem(preloadReloadKey) ?? 0);
  if (Date.now() - lastReload < 60_000) {
    return;
  }
  event.preventDefault();
  sessionStorage.setItem(preloadReloadKey, String(Date.now()));
  window.location.reload();
});
</script>

<template>
  <RouterView />
  <GlobalPWA />
</template>
