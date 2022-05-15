<template>
  <q-icon
    name="fas fa-pen"
    :color="disable ? '' : 'secondary'"
    style="cursor: pointer"
  >
    <q-tooltip> {{ $t('multipleValuesText') }} </q-tooltip>
  </q-icon>
</template>

<script setup lang="ts">
defineProps({
  disable: {
    type: Boolean,
    default: false,
  },
});
</script>
