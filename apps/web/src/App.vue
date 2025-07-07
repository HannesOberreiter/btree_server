<template>
  <router-view />
  <GlobalPWA />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import GlobalPWA from './components/GlobalPWA.vue';
</script>
