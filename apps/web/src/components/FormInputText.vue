<template>
  <q-input
    v-model.trim="modelValue"
    :error="v.text.$error"
    :error-message="validationErrors(v.text)"
    :no-error-icon="true"
    :label="
      disable
        ? $t(label, labelPlural) + ' - ' + $t('multipleValues')
        : $t(label, labelPlural)
    "
    :disable="disable"
    :name="label"
    :type="type"
    :min="minValid"
    :max="maxValid"
    filled
  >
    <template v-if="icon !== ''" #before>
      <q-icon v-if="!multipleValues" :name="icon"></q-icon>
      <btn-multiple-values
        v-else
        :disable="disable"
        @click="editValues(!disable)"
      ></btn-multiple-values>
    </template>
    <template #after><slot name="deepAfter"></slot></template>
    <template #prepend><slot name="deepPrepend"></slot></template>
  </q-input>
</template>

<script setup lang="ts">
import { maxLength, required, minLength } from '~/helpers/i18n-validators';
import { useVModels } from '@vueuse/core';
import { validationErrors, formCheckMultipleValues } from '~/helpers';
import useVuelidate from '@vuelidate/core';
import BtnMultipleValues from './BtnMultipleValues.vue';
import { PropType } from 'vue';
import { isEmpty } from 'lodash';
import { TextField } from '~/types';

const props = defineProps({
  modelValue: {
    type: null as unknown as PropType<string | null>,
    validator: (v: any) => typeof v === 'string' || v === null,
    default: '',
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
  type: {
    type: String as PropType<TextField>,
    default: 'text',
  },
  labelPlural: {
    type: Number,
    default: 1,
  },
  icon: {
    type: String,
    default: '',
  },
  maxValid: {
    default: 48,
  },
  minValid: {
    default: 0,
  },
  required: {
    default: false,
  },
});
const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);
const resetValue = unref(modelValue.value);
const { values, reset } = toRefs(props);
const multipleValues = computed(() =>
  formCheckMultipleValues(values.value, props.label)
);
const disable = ref(multipleValues.value);
modelValue.value = disable.value ? null : modelValue.value;
const state = {
  text: modelValue,
};
const rules = computed(() => {
  if (props.required) {
    return {
      text: {
        required,
        maxLengthValue: maxLength(props.maxValid),
        minLengthValue: minLength(props.minValid),
      },
    };
  } else {
    return {
      text: {
        maxLengthValue: maxLength(props.maxValid),
        minLengthValue: minLength(props.minValid),
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

function setValues() {
  disable.value = multipleValues.value;
  if (multipleValues.value) editValues(true);
  else if (values.value && !isEmpty(values.value)) {
    modelValue.value =
      values.value[0][
        props.label === 'frame' ? props.label + 's' : props.label
      ];
  } else modelValue.value = resetValue;
}

function editValues(val: boolean) {
  disable.value = val;
  modelValue.value = disable.value ? null : modelValue.value;
}
</script>
