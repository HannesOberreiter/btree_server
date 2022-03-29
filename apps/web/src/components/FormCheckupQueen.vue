<template>
  <div
    class="row q-field--labeled"
    :class="$q.dark.isActive ? 'q-field--dark' : 'q-field'"
  >
    <div class="q-field__before q-field__marginal items-center">
      <q-icon v-if="!modelMultiple" name="fas fa-venus"></q-icon>
      <btn-multiple-values
        v-else
        @click="modelMultiple = !modelMultiple"
      ></btn-multiple-values>
    </div>
    <div>
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
  </div>
</template>

<script setup lang="ts">
import { useVModels } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import BtnMultipleValues from './BtnMultipleValues.vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();
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
