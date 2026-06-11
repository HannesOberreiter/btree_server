<script setup lang="ts">
import type { PropType } from 'vue';
import type { TextField } from '../types';
import useVuelidate from '@vuelidate/core';
import { useVModels } from '@vueuse/core';
import { isEmpty } from 'lodash-es';
import { computed, ref, toRefs, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { formCheckMultipleValues, validationErrors } from '../helpers';
import {
  maxLength,
  minLength,
  requiredField
} from '../helpers/i18n-validators';
import BtnMultipleValues from './BtnMultipleValues.vue';

const props = defineProps({
  modelValue: {
    type: String as PropType<string | null>,
    default: null
  },
  reset: {
    type: Number,
    default: 0
  },
  values: {
    type: Object,
    default: null
  },
  label: {
    type: String,
    required: true
  },
  tableId: {
    type: String,
    default: null
  },
  name: {
    default: ''
  },
  type: {
    type: String as PropType<TextField>,
    default: 'text'
  },
  labelPlural: {
    type: Number,
    default: 1
  },
  icon: {
    type: String,
    default: ''
  },
  maxValid: {
    default: 48
  },
  minValid: {
    default: 0
  },
  required: {
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

const { t } = useI18n();

const { modelValue } = useVModels(props, emit);
const resetValue = unref(modelValue.value);
const { values, reset } = toRefs(props);
const multipleValues = computed(() =>
  formCheckMultipleValues(values.value, props.tableId ?? props.label)
);
const disable = ref(multipleValues.value);
modelValue.value = disable.value ? null : modelValue.value;
const state = {
  [props.label]: modelValue
};
const rules = computed(() => {
  if (props.required) {
    return {
      [props.label]: {
        required: requiredField(t(props.label)),
        maxLengthValue: maxLength(props.maxValid),
        minLengthValue: minLength(props.minValid)
      }
    };
  } else {
    return {
      [props.label]: {
        maxLengthValue: maxLength(props.maxValid),
        minLengthValue: minLength(props.minValid)
      }
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

function setValues() {
  disable.value = multipleValues.value;
  if (multipleValues.value) {
    editValues(true);
  } else if (values.value && !isEmpty(values.value)) {
    modelValue.value = values.value[0][props.tableId ?? props.label];
  } else {
    modelValue.value = resetValue;
  }
}

function editValues(val: boolean) {
  disable.value = val;
  modelValue.value = disable.value ? null : modelValue.value;
}
</script>

<template>
  <q-input
    v-model.trim="modelValue"
    :error="v[label].$error"
    :error-message="validationErrors(v[label])"
    :no-error-icon="true"
    :label="
      disable
        ? `${$t(label, labelPlural)} - ${$t('multipleValues')}`
        : $t(label, labelPlural)
    "
    :disable="disable"
    :name="name ? name : label"
    :type="type"
    :min="minValid"
    :max="maxValid"
    filled
  >
    <template v-if="icon !== ''" #before>
      <slot v-if="$slots.deepBefore" name="deepBefore" />
      <div v-if="icon === 'none' && !multipleValues" />
      <q-icon v-else-if="!multipleValues" :name="icon" />
      <BtnMultipleValues
        v-else
        :disable="disable"
        @click="editValues(!disable)"
      />
    </template>
    <template #after>
      <slot v-if="$slots.deepAfter" name="deepAfter" />
    </template>
    <template v-if="$slots.deepPrepend" #prepend>
      <slot name="deepPrepend" />
    </template>
  </q-input>
</template>
