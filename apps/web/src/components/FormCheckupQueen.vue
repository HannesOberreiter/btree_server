<template>
  <div class="row q-pb-sm">
    <q-option-group
      name="accepted_genres"
      v-model="queen"
      :options="options"
      type="checkbox"
      color="primary"
      inline
    >
    </q-option-group>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const queen = ref([]);
const options = [
  { label: t('queen'), value: 'queen', trueValue: true },
  { label: t('queencell', 2), value: 'queencells', trueValue: true },
  { label: t('egg', 2), value: 'eggs', trueValue: true },
  { label: t('cappedBrood'), value: 'capped_brood', trueValue: true },
];

watch(queen, (cur) => {
  console.log(cur);
});
</script>
