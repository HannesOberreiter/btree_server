<template>
  <q-input
    v-model="modelValue"
    :error="v.url.$error"
    :error-message="validationErrors(v.url)"
    :no-error-icon="true"
    :label="t('url')"
    :disable="modelMultiple"
    name="url"
    type="text"
    readonly
  >
    <template v-if="modelMultiple" #before>
      <btn-multiple-values
        @click="modelMultiple = !modelMultiple"
      ></btn-multiple-values>
    </template>
    <template v-if="!modelMultiple" #append>
      <q-icon name="fab fa-dropbox" style="cursor: pointer"></q-icon>
    </template>
  </q-input>
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { maxLength } from '~/helpers/i18n-validators';
import { validationErrors } from '~/helpers';
import { useI18n } from 'vue-i18n';
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
  url: modelValue,
};
const rules = {
  url: { maxLengthValue: maxLength(512) },
};
const v = useVuelidate(rules, state, { $autoDirty: true });
</script>
