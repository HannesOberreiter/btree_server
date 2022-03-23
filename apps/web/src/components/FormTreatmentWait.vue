<template>
  <q-input
    v-model.number="modelValue"
    :error="v.wait.$error"
    :error-message="validationErrors(v.wait)"
    :no-error-icon="true"
    :label="t('waitTime')"
    :shadow-text="t('day', 2)"
    name="wait"
    type="number"
    filled
  >
    <template #before>
      <q-icon name="fas fa-circle-pause"></q-icon>
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
import { minValue, maxValue, integer } from '~/helpers/i18n-validators';
import { useI18n } from 'vue-i18n';
import { useVModels } from '@vueuse/core';
import { validationErrors } from '~/helpers';
import useVuelidate from '@vuelidate/core';

const { t } = useI18n();
const props = defineProps({
  modelValue: {
    type: Number,
    default: 0,
  },
});
const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);

const state = {
  wait: modelValue,
};
const rules = {
  wait: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    numeric: integer,
  },
};
const v = useVuelidate(rules, state, { $autoDirty: true });
</script>
