<template>
  <q-input
    v-model="modelValue"
    :error="v.water.$error"
    :error-message="validationErrors(v.water)"
    :no-error-icon="true"
    :label="t('water')"
    :disable="modelMultiple"
    name="water"
    type="number"
    shadow-text="%"
    filled
  >
    <template #before>
      <q-icon v-if="!modelMultiple" name="fas fa-droplet"></q-icon>
      <btn-multiple-values
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
        :disable="modelValue > 100"
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
    type: Number,
    default: 0,
  },
  modelMultiple: {
    default: false,
  },
});
const emit = defineEmits(['update:modelValue', 'update:modelMultiple']);
const { modelValue, modelMultiple } = useVModels(props, emit);

const state = {
  water: modelValue,
};
const rules = {
  water: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    numeric: numeric,
  },
};
const v = useVuelidate(rules, state, { $autoDirty: true });
</script>
