<template>{{ $t('apiary') }} {{ id }}</template>

<script setup lang="ts">
defineProps({
  id: {
    type: String,
    required: true,
  },
});
</script>
