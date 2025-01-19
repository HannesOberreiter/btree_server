<template>
  <q-input v-model.number="modelValue" :error="v[props.label]['$error']"
    :error-message="validationErrors(v[props.label])" :no-error-icon="true" :label="disable
        ? $t(label, labelPlural) + ' - ' + $t('multipleValues')
        : $t(label, labelPlural)
      " :disable="disable" :name="label" type="number" :min="minValid" :max="maxValid" filled @update:model-value="(val) => $emit('update:modelValue', val === '' ? 0 : val)
      ">
    <template v-if="icon !== ''" #before>
      <q-icon v-if="!multipleValues" :name="icon"></q-icon>
      <btn-multiple-values v-else :disable="disable" @click="editValues(!disable)"></btn-multiple-values>
    </template>
    <template #append>
      <btn-base round flat dense icon="fas fa-plus" :disable="modelValue >= maxValid"
        @click="() => (modelValue ? modelValue++ : '')"></btn-base>
      <btn-base round flat dense icon="fas fa-minus" :disable="modelValue <= minValid"
        @click="() => (modelValue ? modelValue-- : '')"></btn-base>
    </template>
    <template #after>
      <slot name="deepAfter"></slot>
    </template>
  </q-input>
</template>

<script setup lang="ts">
import {
  minValue,
  maxValue,
  numeric,
  integer,
  decimal,
} from '../helpers/i18n-validators';
import { useVModels } from '@vueuse/core';
import { validationErrors, formCheckMultipleValues } from '../helpers';
import useVuelidate from '@vuelidate/core';
import type { PropType } from 'vue';
import { unref, toRefs, computed, ref, watch } from 'vue';
import { isEmpty } from 'lodash-es';
import BtnMultipleValues from './BtnMultipleValues.vue';
import BtnBase from './BtnBase.vue';

const props = defineProps({
  modelValue: {
    type: null as unknown as PropType<number | null>,
    validator: (v: any) => typeof v === 'number' || v === null,
    default: 0,
  },
  reset: {
    type: Number,
    default: 0,
  },
  values: {
    type: Object,
    default: null,
  },
  label: {
    type: String,
    required: true,
  },
  tableId: {
    type: String,
    default: null,
  },
  labelPlural: {
    type: Number,
    default: 1,
  },
  icon: {
    type: String,
    required: true,
  },
  maxValid: {
    default: 100,
  },
  minValid: {
    default: 0,
  },
  numericValid: {
    default: 'numeric',
  },
});
const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);
const resetValue = unref(modelValue.value);
const { values, reset } = toRefs(props);
const multipleValues = computed(() => {
  return formCheckMultipleValues(values.value, props.tableId ?? props.label);
});
const disable = ref(multipleValues.value);

const state = {
  [props.label]: modelValue,
};
const rules = computed(() => {
  if (props.numericValid === 'numeric') {
    return {
      [props.label]: {
        minValue: minValue(props.minValid),
        maxValue: maxValue(props.maxValid),
        numeric: numeric,
      },
    };
  } else if (props.numericValid === 'decimal') {
    return {
      [props.label]: {
        minValue: minValue(props.minValid),
        maxValue: maxValue(props.maxValid),
        decimal: decimal,
      },
    };
  } else {
    return {
      [props.label]: {
        minValue: minValue(props.minValid),
        maxValue: maxValue(props.maxValid),
        integer: integer,
      },
    };
  }
});
const v = useVuelidate(rules as any, state, { $autoDirty: true });

watch(values, () => {
  setValues();
});

watch(reset, () => {
  setValues();
});

function setValues () {
  disable.value = multipleValues.value;
  if (multipleValues.value) editValues(true);
  else if (values.value && !isEmpty(values.value)) {
    modelValue.value =
      values.value[0][props.tableId ? props.tableId : props.label];
  } else modelValue.value = resetValue;
}

function editValues (val: boolean) {
  disable.value = val;
  modelValue.value = disable.value ? null : modelValue.value;
}
</script>
