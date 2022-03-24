<template>
  <q-select
    v-model="modelValue"
    :label="$t(label)"
    name="apiary"
    :error="v.apiary.$error"
    :error-message="validationErrors(v.apiary)"
    :no-error-icon="true"
    :loading="isLoading"
    :disable="isLoading || modelMultiple"
    :options="options"
    filled
  >
    <template v-if="modelMultiple" #before>
      <btn-multiple-values
        @click="modelMultiple = !modelMultiple"
      ></btn-multiple-values>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { filter } from 'lodash';
import { computed } from 'vue';
import { useApiariesQuery } from '~/query';
import { useVModels } from '@vueuse/core';
import BtnMultipleValues from './BtnMultipleValues.vue';
import useVuelidate from '@vuelidate/core';
import { required } from '~/helpers/i18n-validators';
import { validationErrors } from '~/helpers';

const props = defineProps({
  modelValue: {
    default: null,
  },
  label: {
    default: 'apiary',
  },
  modelMultiple: {
    default: false,
  },
});
const { isLoading, data } = useApiariesQuery();
const emit = defineEmits(['update:modelValue', 'update:modelMultiple']);
const { modelValue, modelMultiple } = useVModels(props, emit);

const options = computed(() => {
  return data ? setOptions(data.value.result) : [];
});

const state = {
  apiary: modelValue,
};
const rules = {
  apiary: { required },
};
const v = useVuelidate(rules, state, { $autoDirty: true });

function setOptions(v: any) {
  const temp = filter(v, (obj) => obj.modus);
  modelValue.value = temp[0];
  return temp;
}
</script>
