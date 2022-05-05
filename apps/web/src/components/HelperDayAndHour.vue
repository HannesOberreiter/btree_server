<template>
  <span v-if="result.days > 0">
    {{ result.days }} {{ $t('day', result.days > 1 ? 2 : 1) }} -
    {{ result.hours }}h
  </span>
  <span v-else>{{ hour }}h</span>
</template>

<script lang="ts">
import round from 'lodash-es/round';
function calculateDaysAndHours(value: number) {
  const days = round(value / 24);
  const hours = value - days * 24;
  return {
    days: days,
    hours: hours,
  };
}
</script>

<script setup lang="ts">
const props = defineProps({
  hour: {
    type: Number,
    required: true,
  },
});
const result = calculateDaysAndHours(props.hour);
</script>
