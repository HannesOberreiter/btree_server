<template>
  <q-separator />
  <ul>
    <li v-for="(item, index) in eventInfo.info" :key="index">
      {{ dayjs(item.date).format('YYYY-MM-DD') }} - {{ item.text }}
      <p v-if="index == 1">
        <q-separator />
      </p>
    </li>
  </ul>
  <q-separator />

  Wanderungen und Änderungen innerhalb von 7 Tagen.
</template>

<script setup lang="ts">
import dayjs from 'dayjs';

defineProps({
  eventInfo: {
    type: Object as any,
    required: true,
  },
});
</script>
