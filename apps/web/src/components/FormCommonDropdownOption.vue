<template>
  <q-select
    v-model="modelValue"
    :label="t(label)"
    name="option"
    :loading="isLoading"
    :disable="isLoading || modelMultiple"
    :options="options"
    option-label="name"
    options-value="id"
    filled
    class="q-pb-sm"
  >
    <template #before>
      <q-icon v-if="!modelMultiple" name="far fa-square-caret-down"></q-icon>
      <btn-multiple-values
        v-else
        @click="modelMultiple = !modelMultiple"
      ></btn-multiple-values>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { filter } from 'lodash';
import { Option } from '~/types';
import { PropType, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useOptionsQuery } from '~/query';
import { useVModels } from '@vueuse/core';
import BtnMultipleValues from './BtnMultipleValues.vue';

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
  modelMultiple: {
    default: false,
  },
});
const { isLoading, data } = useOptionsQuery(props.table);
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
  const temp = filter(data.value, (obj) => obj.modus);
  options.value = temp;
  modelValue.value = temp[0];
}
</script>
