<template>
  <q-input
    v-model="modelValue"
    :error="v.strong.$error"
    :error-message="validationErrors(v.strong)"
    :no-error-icon="true"
    :label="t('strong')"
    name="strong"
    :disable="modelMultiple"
    type="number"
    filled
  >
    <template #before>
      <q-icon v-if="!modelMultiple" name="fas fa-dumbbell"></q-icon>
      <btn-multiple-values
        v-else
        @click="modelMultiple = !modelMultiple"
      ></btn-multiple-values>
    </template>
    <template #append>
      <q-btn
        round
        flat
        dense
        icon="fas fa-plus"
        style="cursor: pointer"
        @click="modelValue++"
      ></q-btn>
      <q-btn
        round
        flat
        dense
        icon="fas fa-minus"
        style="cursor: pointer"
        :disable="modelValue <= 0"
        @click="modelValue--"
      ></q-btn>
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { minValue, maxValue, numeric } from '~/helpers/i18n-validators';
import { useI18n } from 'vue-i18n';
import { useVModels } from '@vueuse/core';
import { validationErrors } from '~/helpers';
import useVuelidate from '@vuelidate/core';
import BtnMultipleValues from './BtnMultipleValues.vue';

const { t } = useI18n();
const props = defineProps({
  modelValue: {
    default: 0,
  },
  modelMultiple: {
    default: false,
  },
});
const emit = defineEmits(['update:modelValue', 'update:modelMultiple']);
const { modelValue, modelMultiple } = useVModels(props, emit);

const state = {
  strong: modelValue,
};
const rules = {
  strong: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    numeric: numeric,
  },
};
const v = useVuelidate(rules, state, { $autoDirty: true });
</script>
