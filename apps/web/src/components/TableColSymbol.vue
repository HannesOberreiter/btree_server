<template>
  <q-td class="text-center">
    <q-icon
      :name="value ? `fas fa-${value}` : 'fas fa-venus'"
      size="sm"
    ></q-icon>
  </q-td>
</template>

<script setup lang="ts">
defineProps({
  value: {
    required: true,
  },
});
</script>
