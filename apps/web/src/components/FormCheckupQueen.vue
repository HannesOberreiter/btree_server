import { ref } from 'vue';
<template>
  <q-option-group
    v-model="queen"
    name="accepted_genres"
    :options="options"
    type="checkbox"
    color="primary"
    inline
  >
  </q-option-group>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const queen = ref([]);
const options = [
  { label: t('queen'), value: 'queen', trueValue: true },
  { label: t('queencell', 2), value: 'queencells', trueValue: true },
  { label: t('egg', 2), value: 'eggs', trueValue: true },
  { label: t('cappedBrood'), value: 'capped_brood', trueValue: true },
];
</script>
