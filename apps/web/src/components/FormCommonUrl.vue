<template>
  <q-input
    v-model="modelValue"
    :error="v.url.$error"
    :error-message="validationErrors(v.url)"
    :no-error-icon="true"
    :label="t('url')"
    name="url"
    type="text"
    readonly
  >
    <template #append>
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
const { t } = useI18n();
const props = defineProps({
  modelValue: {
    default: '',
  },
});
const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);

const state = {
  url: modelValue,
};
const rules = {
  url: { maxLengthValue: maxLength(512) },
};
const v = useVuelidate(rules, state, { $autoDirty: true });
</script>
