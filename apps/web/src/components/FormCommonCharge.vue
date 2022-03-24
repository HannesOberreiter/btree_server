<template>
  <q-input
    v-model="modelValue"
    :error="v.charge.$error"
    :error-message="validationErrors(v.charge)"
    :no-error-icon="true"
    :disable="modelMultiple"
    :label="t('charge')"
    charge="charge"
    type="text"
    filled
  >
    <template v-if="modelMultiple" #before>
      <btn-multiple-values
        @click="modelMultiple = !modelMultiple"
      ></btn-multiple-values>
    </template>
    <template #prepend> L </template>
  </q-input>
</template>

<script setup lang="ts">
import { maxLength } from '~/helpers/i18n-validators';
import { useI18n } from 'vue-i18n';
import { useVModels } from '@vueuse/core';
import { validationErrors } from '~/helpers';
import useVuelidate from '@vuelidate/core';
import BtnMultipleValues from './BtnMultipleValues.vue';

const { t } = useI18n();
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
  charge: modelValue,
};
const rules = {
  charge: { maxLengthValue: maxLength(48) },
};
const v = useVuelidate(rules, state, { $autoDirty: true });
</script>
