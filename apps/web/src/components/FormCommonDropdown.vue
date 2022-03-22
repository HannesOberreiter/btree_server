<template>
  <q-select
    v-model="modelValue"
    :label="t(label)"
    name="option"
    :loading="isLoading"
    :disable="isLoading"
    :options="options"
    option-label="name"
    options-value="id"
    filled
  >
  </q-select>
</template>

<script setup lang="ts">
import { filter } from 'lodash';
import { Option } from '~/types';
import { PropType, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useOptionsQuery } from '~/query';
import { useVModels } from '@vueuse/core';

const { t } = useI18n();
const props = defineProps({
  modelValue: {
    default: null,
  },
  label: {
    default: 'type',
  },
  table: {
    type: String as PropType<Option>,
    required: true,
  },
});
const { isLoading, data } = useOptionsQuery(props.table);
const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);

const options = ref([] as any);

if (data.value) {
  setOptions();
} else {
  watch(data, () => {
    setOptions();
  });
}

function setOptions() {
  const temp = filter(data.value, (obj) => obj.modus);
  options.value = temp;
  modelValue.value = temp[0];
}
</script>
