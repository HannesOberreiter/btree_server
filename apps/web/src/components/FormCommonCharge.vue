<template>
  <q-input
    v-model="state.charge"
    :error="v.charge.$error"
    :error-message="validationErrors(v.charge)"
    :no-error-icon="true"
    :label="t('charge')"
    charge="charge"
    type="text"
    filled
  >
    <template #prepend> L </template>
  </q-input>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import { maxLength } from '~/helpers/i18n-validators';
import { useI18n } from 'vue-i18n';
import { useVModels } from '@vueuse/core';
import { validationErrors } from '~/helpers';
import useVuelidate from '@vuelidate/core';

const { t } = useI18n();
const props = defineProps({
  modelValue: {
    default: '',
  },
});
const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);

const state = reactive({
  charge: modelValue.value,
});
const rules = {
  charge: { maxLengthValue: maxLength(48) },
};
const v = useVuelidate(rules, state, { $autoDirty: true });

watch(props, (cur) => {
  state.charge = cur.modelValue;
});

watch(state, (cur) => {
  emit('update:modelValue', cur.charge);
});
</script>
