<template>
  <q-separator />
  <ul>
    <li v-for="(item, index) in eventInfo.info" :key="index">
      {{ useDate.displayFormat(item.date) }} - {{ item.text }}
      <p v-if="index == 1">
        <q-separator />
      </p>
    </li>
  </ul>
  <q-separator />

  Wanderungen und Änderungen innerhalb von 7 Tagen.
</template>

<script setup lang="ts">
import { useDateFormat } from '~/composables/useDate';

const useDate = useDateFormat();
defineProps({
  eventInfo: {
    type: Object as any,
    required: true,
  },
});
</script>
