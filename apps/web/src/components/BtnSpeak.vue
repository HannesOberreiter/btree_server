<template>
  <btn-base
    v-close-popup
    flat
    dense
    color="white"
    size="md"
    icon="fas fa-microphone"
    @click="onSpeak"
  />
</template>

<script setup lang="ts">
function onSpeak() {
  console.log('Speaking ...');
}
</script>
