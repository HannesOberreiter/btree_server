<script setup lang="ts">
import { useVModels } from '@vueuse/core';
import { isEmpty, round } from 'lodash-es';
import { watch } from 'vue';
import FormInputNumeric from './FormInputNumeric.vue';

const props = defineProps({
  modelValue: {
    default: 0
  },
  modelType: {
    type: String,
    default: 'single'
  },
  modelCalc: {
    default: 0
  },
  hiveCount: {
    type: Number,
    default: 0
  },
  label: {
    type: String,
    default: 'amount'
  },
  reset: {
    type: Number,
    default: 0
  },
  values: {
    type: Object,
    default: null
  },
  tableId: {
    type: String,
    default: null
  }
});
const emit = defineEmits([
  'update:modelValue',
  'update:modelType',
  'update:modelCalc'
]);
const { modelValue, modelType, modelCalc } = useVModels(props, emit);

const OPTIONS = ['single', 'total'];

watch(props, () => {
  if (props.hiveCount > 0 && modelType.value === 'total') {
    modelCalc.value = round(modelValue.value / props.hiveCount, 2);
  } else {
    modelCalc.value = modelValue.value;
  }
});
</script>

<template>
  <div class="row">
    <div class="col-10">
      <FormInputNumeric
        v-model="modelValue"
        :label="label"
        :label-plural="2"
        :values="values"
        :reset="reset"
        :max-valid="10000"
        :table-id="tableId"
        icon="fas fa-bucket"
        :hint="
          hiveCount > 0 && modelType === 'total'
            ? $t('totalAmount', { msg: modelCalc })
            : ''
        "
      />
    </div>
    <div v-if="!values || isEmpty(values)" class="col-2 q-pl-xs">
      <q-select
        v-model="modelType"
        :options="OPTIONS"
        :option-label="val => $t(val)"
        borderless
        hide-dropdown-icon
      />
    </div>
  </div>
</template>
