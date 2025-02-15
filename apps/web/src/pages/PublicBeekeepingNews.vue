<template>
  <PublicLayout>
    <BeekeepingNews :is-public="true"></BeekeepingNews>
  </PublicLayout>
</template>

<script setup lang="ts">
import PublicLayout from 'src/layouts/PublicLayout.vue';
import BeekeepingNews from './BeekeepingNews.vue';
</script>
