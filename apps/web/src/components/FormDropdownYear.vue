<template>
  <q-select
    v-model="modelValue"
    :options="options"
    :label="$t('year')"
    name="year"
    option-value="id"
    filled
    class="q-pb-sm"
  >
    <template #before>
      <q-icon name="far fa-square-caret-down"></q-icon>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { filter, isEmpty } from 'lodash-es';
import { useVModels } from '@vueuse/core';

const { t } = useI18n();

// https://stackoverflow.com/a/55776744/5316675
const range = (start: number, stop: number, step: number) =>
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step);

const options = ref(null);

const props = defineProps({
  modelValue: {
    default: new Date().getFullYear(),
  },
  reset: {
    type: Number,
    default: 0,
  },
  values: {
    type: Object,
    default: null,
  },
  allYear: {
    type: Boolean,
    default: false,
  },
  allowEmpty: {
    type: Number,
    default: null,
  },
  filterEmpty: {
    type: String,
    default: '',
  },
});

const currentYear = props.allYear
  ? new Date().getFullYear()
  : new Date().getFullYear() - 1;
const YEARS = range(currentYear, currentYear - 50, -1).map(function (val) {
  return { label: val, id: val };
});

const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);
const { values, reset } = toRefs(props);

watch(
  [values, reset],
  () => {
    setValues();
  },
  {
    immediate: true,
  }
);

function setValues() {
  if (values.value && !isEmpty(values.value)) {
    setOptions(values.value[0]['year']);
  } else if (modelValue.value && typeof modelValue.value !== 'object') {
    setOptions(modelValue.value);
  } else setOptions();
}

function setOptions(id: string | number = 0) {
  if (props.allowEmpty && props.filterEmpty !== '') {
    options.value = [
      { label: t(props.filterEmpty), id: 'empty' },
      { label: props.allowEmpty, value: new Date().getFullYear() },
      ...YEARS,
    ];
  } else if (props.allowEmpty) {
    options.value = [
      { label: props.allowEmpty, value: new Date().getFullYear() },
      ...YEARS,
    ];
  } else if (props.filterEmpty !== '') {
    options.value = [{ label: t(props.filterEmpty), id: 'empty' }, ...YEARS];
  } else {
    options.value = YEARS;
  }

  if (id === 0) modelValue.value = options.value[0];
  else if (props.allYear) {
    modelValue.value = options.value[0];
  } else {
    const res = filter(options.value, (obj) => {
      return obj.id === id;
    });
    modelValue.value = res[0];
  }
}
</script>
