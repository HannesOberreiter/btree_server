<template>
  <q-select
    v-model="modelValue"
    :label="$t(label)"
    name="apiary"
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
import { ref, watch } from 'vue';
import { useApiariesQuery } from '~/query';
import { useVModels } from '@vueuse/core';
import BtnMultipleValues from './BtnMultipleValues.vue';

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

const options = ref([] as any);

if (data.value) {
  setOptions();
} else {
  watch(data, () => {
    setOptions();
  });
}

function setOptions() {
  console.log(data.value.result);
  const temp = filter(data.value.result, (obj) => obj.modus);
  options.value = temp;
  console.log(options.value);
  modelValue.value = temp[0];
}
</script>
