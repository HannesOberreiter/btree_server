<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { useVModels } from '@vueuse/core';
import { validationErrors } from '../helpers';
import { requiredField } from '../helpers/i18n-validators';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  options: {
    type: Array,
    required: true
  },
  offLabel: {
    type: String,
    default: 'hive'
  }
});

const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);

const state = {
  edit: modelValue
};

const rules = {
  edit: { required: requiredField('ID') }
};
const v = useVuelidate(rules, state);
</script>

<template>
  <q-select
    v-model="modelValue"
    :error="v.edit.$error"
    :error-message="validationErrors(v.edit)"
    :no-error-icon="true"
    :label="`${$t('edit')} ID / (${$t(offLabel)})`"
    :options="options"
    counter
    multiple
    use-chips
    filled
    class="hive-select"
  />
</template>

<style>
.hive-select .q-field__native {
  max-height: 120px;
  overflow-y: auto;
}

.q-dialog--modal .q-field__native {
  max-height: 120px;
  overflow-y: auto;
}
</style>
