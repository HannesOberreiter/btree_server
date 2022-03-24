<template>
  <q-input
    v-model="modelValue"
    :error="v.name.$error"
    :error-message="validationErrors(v.name)"
    :no-error-icon="true"
    :label="$t('name')"
    :disable="modelMultiple"
    name="name"
    type="text"
    filled
  >
  </q-input>
</template>

<script setup lang="ts">
import { required, maxLength } from '~/helpers/i18n-validators';
import { validationErrors } from '~/helpers';
import useVuelidate from '@vuelidate/core';
import { useVModels } from '@vueuse/core';

const props = defineProps({
  modelValue: {
    default: '',
  },
  modelMultiple: {
    default: false,
  },
});
const emit = defineEmits(['update:modelValue', 'update:modelMultiple']);
const { modelValue, modelMultiple } = useVModels(props, emit);

const state = {
  name: modelValue,
};
const rules = {
  name: { required, maxLengthValue: maxLength(48) },
};
const v = useVuelidate(rules, state, { $autoDirty: true });
</script>
