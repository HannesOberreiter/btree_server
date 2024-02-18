<template>
  <q-select
    v-model="format"
    :options="FORMATS"
    option-value="value"
    option-label="label"
    :label="$t('dateDisplayFormat')"
    filled
    :dense="true"
    :emit-value="true"
  >
    <template #prepend>
      <q-icon name="fas fa-calendar-days" />
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { FORMATS } from '~/constants';
import { ref } from 'vue';
const format = ref(FORMATS[1]);
</script>
