<template>
  <head>
    <title>b.tree - Professional Beekeeping Database - Map Velutina</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <div ref="iframeRef" class="iframe-container">
    <map-pest :is-public="true"></map-pest>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, onMounted } from 'vue';
import MapPest from '~/components/MapPest.vue';

const iframeRef = ref<HTMLIFrameElement | null>(null);

onMounted(() => {
  resizeIframe();
  window.addEventListener('resize', resizeIframe);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeIframe);
});

function resizeIframe() {
  if (iframeRef.value) {
    iframeRef.value.style.height = `${iframeRef.value.scrollHeight}px`;
  }
}
</script>

<style>
.iframe-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
