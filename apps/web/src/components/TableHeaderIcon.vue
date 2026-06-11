<script setup lang="ts">
defineProps({
  label: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  }
});
</script>

<template>
  <span>
    <q-icon :name="icon" size="1.2em" /><br />
    {{ label }}
  </span>
</template>
