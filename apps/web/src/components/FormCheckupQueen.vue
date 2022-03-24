<template>
  <div class="row">
    <btn-multiple-values
      v-if="modelMultiple"
      @click="modelMultiple = !modelMultiple"
    ></btn-multiple-values>
    <q-option-group
      v-model="modelValue"
      :options="options"
      :disable="modelMultiple"
      type="checkbox"
      color="primary"
      name="queen"
      inline
    >
    </q-option-group>
  </div>
</template>

<script setup lang="ts">
import { useVModels } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import BtnMultipleValues from './BtnMultipleValues.vue';

const { t } = useI18n();
const props = defineProps({
  modelValue: {
    default: [],
  },
  modelMultiple: {
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'update:modelMultiple']);
const { modelValue, modelMultiple } = useVModels(props, emit);

const options = [
  { label: t('queen'), value: 'queen', trueValue: true },
  { label: t('queencell', 2), value: 'queencells', trueValue: true },
  { label: t('egg', 2), value: 'eggs', trueValue: true },
  { label: t('cappedBrood'), value: 'capped_brood', trueValue: true },
];
</script>
