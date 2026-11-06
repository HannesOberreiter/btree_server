<script setup lang="ts">
import { useDateFormat } from '../composables/useDate';

defineProps({
  eventInfo: {
    type: Object as any,
    required: true
  }
});
const useDate = useDateFormat();
</script>

<template>
  <q-separator />
  <ul>
    <li v-for="(item, index) in eventInfo.info" :key="index">
      {{ useDate.displayFormat(item.date) }} - {{ item.text }}
      <p v-if="index === 1">
        <q-separator />
      </p>
    </li>
  </ul>
  <q-separator />

  Wanderungen und Änderungen innerhalb von 7 Tagen.
  <p class="q-mt-sm">
    <b>Login: </b>
    <a href="https://portal.statistik.at/" target="_blank">
      https://portal.statistik.at/
    </a>
  </p>
</template>
