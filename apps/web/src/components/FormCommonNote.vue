<template>
  <q-input
    v-model="modelValue"
    :error="v.note.$error"
    :error-message="validationErrors(v.note)"
    :no-error-icon="true"
    :label="t('note')"
    :disable="modelMultiple"
    name="note"
    type="textarea"
    filled
  >
    <template v-if="modelMultiple" #before>
      <btn-multiple-values
        @click="modelMultiple = !modelMultiple"
      ></btn-multiple-values>
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { maxLength } from '~/helpers/i18n-validators';
import { useI18n } from 'vue-i18n';
import { validationErrors } from '~/helpers';
import useVuelidate from '@vuelidate/core';
import { useVModels } from '@vueuse/core';
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
  note: modelValue,
};
const rules = {
  note: { maxLengthValue: maxLength(2000) },
};
const v = useVuelidate(rules, state, { $autoDirty: true });
</script>
