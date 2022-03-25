<template>
  <q-input
    v-model.number="modelValue"
    :error="v.num.$error"
    :error-message="validationErrors(v.num)"
    :no-error-icon="true"
    :label="$t(label)"
    :disable="modelMultiple"
    :name="label"
    type="number"
    :min="0"
    :max="maxValid"
    filled
  >
    <template v-if="icon !== ''" #before>
      <q-icon v-if="!modelMultiple" :name="icon"></q-icon>
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
        :disable="modelValue > maxValid"
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
import {
  minValue,
  maxValue,
  numeric,
  integer,
} from '~/helpers/i18n-validators';
import { useVModels } from '@vueuse/core';
import { validationErrors } from '~/helpers';
import useVuelidate from '@vuelidate/core';
import BtnMultipleValues from './BtnMultipleValues.vue';

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0,
  },
  modelMultiple: {
    default: false,
  },
  label: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  maxValid: {
    default: 100,
  },
  numericValid: {
    default: 'numeric',
  },
});
const emit = defineEmits(['update:modelValue', 'update:modelMultiple']);
const { modelValue, modelMultiple } = useVModels(props, emit);

const state = {
  num: modelValue,
};
let rules = {};

if (props.numericValid === 'numeric') {
  rules = {
    num: {
      minValue: minValue(0),
      maxValue: maxValue(props.maxValid),
      numeric: numeric,
    },
  };
} else {
  rules = {
    num: {
      minValue: minValue(0),
      maxValue: maxValue(props.maxValid),
      integer: integer,
    },
  };
}

const v = useVuelidate(rules as any, state, { $autoDirty: true });
</script>
