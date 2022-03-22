<template>
  <div class="row">
    <div class="col-10">
      <q-input
        v-model.number="modelValue"
        :error="v.amount.$error"
        :error-message="validationErrors(v.amount)"
        :no-error-icon="true"
        :label="t(label, 2)"
        name="amount"
        type="number"
        :hint="
          hiveCount > 0 && modelType === 'total'
            ? t('totalAmount', { msg: modelCalc })
            : ''
        "
        filled
      >
        <template #before>
          <q-icon name="fas fa-bucket"></q-icon>
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
    </div>
    <div class="col-2 q-pl-xs">
      <q-select
        v-model="modelType"
        :options="OPTIONS"
        :option-label="(val) => t(val)"
        borderless
        hide-dropdown-icon
      ></q-select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { minValue, maxValue, numeric } from '~/helpers/i18n-validators';
import { round } from 'lodash';
import { useI18n } from 'vue-i18n';
import { useVModels } from '@vueuse/core';
import { validationErrors } from '~/helpers';
import useVuelidate from '@vuelidate/core';
import { watch } from 'vue';

const { t } = useI18n();
const props = defineProps({
  modelValue: {
    default: 0,
  },
  modelType: {
    type: String,
    default: 'single',
  },
  modelCalc: {
    default: 0,
  },
  hiveCount: {
    type: Number,
    default: 0,
  },
  label: {
    type: String,
    default: 'amount',
  },
});
const emit = defineEmits([
  'update:modelValue',
  'update:modelType',
  'update:modelCalc',
]);
const { modelValue, modelType, modelCalc } = useVModels(props, emit);

const OPTIONS = ['single', 'total'];

const state = {
  amount: modelValue,
  type: modelType,
};
const rules = {
  amount: {
    minValue: minValue(0),
    maxValue: maxValue(10000),
    numeric: numeric,
  },
  type: {},
};
const v = useVuelidate(rules, state, { $autoDirty: true });

watch(props, () => {
  if (props.hiveCount > 0 && modelType.value === 'total')
    modelCalc.value = round(modelValue.value / props.hiveCount, 2);
  else modelCalc.value = modelValue.value;
});
</script>
