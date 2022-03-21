<template>
  <q-input
    v-model="state.name"
    :error="v.name.$error"
    :error-message="validationErrors(v.name)"
    :no-error-icon="true"
    :label="t('name')"
    name="name"
    type="text"
    filled
  >
  </q-input>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import { required, maxLength } from '~/helpers/i18n-validators';
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
  name: modelValue.value,
});
const rules = {
  name: { required, maxLengthValue: maxLength(48) },
};
const v = useVuelidate(rules, state, { $autoDirty: true });

watch(props, (cur) => {
  state.name = cur.modelValue;
});

watch(state, (cur) => {
  emit('update:modelValue', cur.name);
});
</script>
