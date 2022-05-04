<template>{{ $t('hive') }} {{ id }}</template>

<script setup lang="ts">
defineProps({
  id: {
    type: String,
    required: true,
  },
});
</script>
