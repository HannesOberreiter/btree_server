<template>
  <q-icon
    name="fas fa-pen"
    :color="disable ? '' : 'secondary'"
    style="cursor: pointer"
  >
    <tooltip-base> {{ $t('multipleValuesText') }} </tooltip-base>
  </q-icon>
</template>

<script setup lang="ts">
import TooltipBase from './TooltipBase.vue';
defineProps({
  disable: {
    type: Boolean,
    default: false,
  },
});
</script>
