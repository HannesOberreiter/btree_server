<template>
  <q-select
    v-model="modelValue"
    :label="$t(label)"
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
      <q-icon v-if="!multipleValues" name="far fa-square-caret-down"></q-icon>
      <btn-multiple-values
        v-else
        :disable="disable"
        @click="editValues(!disable)"
      ></btn-multiple-values>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { filter, isEmpty } from 'lodash';
import { Option } from '~/types';
import { PropType } from 'vue';
import { useOptionsQuery } from '~/query';
import { useVModels } from '@vueuse/core';
import BtnMultipleValues from './BtnMultipleValues.vue';
import { formCheckMultipleValues } from '~/helpers';

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
  reset: {
    type: Number,
    default: 0,
  },
  values: {
    type: Object,
    default: null,
  },
  modelMultiple: {
    default: false,
  },
});
const { isLoading, data } = useOptionsQuery(props.table);
const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);
const { values, reset } = toRefs(props);
const multipleValues = computed(() =>
  formCheckMultipleValues(
    values.value,
    props.label === 'disease' ? 'disease_id' : 'type_id'
  )
);
const disable = ref(multipleValues.value);
const options = ref([] as any);

if (data.value) {
  setOptions();
} else {
  watch(data, () => {
    setOptions();
  });
}

watch(values, () => {
  setValues();
});

watch(reset, () => {
  setValues();
});

function setValues() {
  disable.value = multipleValues.value;
  if (multipleValues.value) editValues(true);
  else if (values.value && !isEmpty(values.value)) {
    setOptions(
      values.value[0][props.label === 'disease' ? 'disease_id' : 'type_id']
    );
  } else setOptions();
}

function setOptions(id = 0) {
  const temp = filter(data.value, (obj) => obj.modus);
  options.value = temp;
  if (id === 0) modelValue.value = temp[0];
  else {
    const res = filter(data.value, (obj) => obj.id === id);
    modelValue.value = res[0];
  }
}

function editValues(val: boolean) {
  disable.value = val;
  modelValue.value = disable.value ? null : modelValue.value;
}
</script>
