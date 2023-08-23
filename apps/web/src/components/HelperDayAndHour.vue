<template>
  <span>
    <span v-if="result.days > 0">
      {{ result.days }} {{ $t('day', result.days > 1 ? 2 : 1) }} -
      {{ result.hours }}h
    </span>
    <span v-else>{{ hour }}h</span>
  </span>
</template>

<script lang="ts">
function calculateDaysAndHours(value: number) {
  const days = Math.floor(value / 24);
  const hours = value - days * 24;
  return {
    days: days,
    hours: hours,
  };
}
</script>

<script setup lang="ts">
import { toRefs } from '@vueuse/core';
import { computed } from 'vue';

const props = defineProps({
  hour: {
    type: Number,
    required: true,
  },
});
const { hour } = toRefs(props);
const result = computed(() => {
  return calculateDaysAndHours(hour.value);
});
</script>
