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
import { filter } from 'lodash-es';
import { useVModels } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';

const { t } = useI18n();

// https://stackoverflow.com/a/55776744/5316675
const range = (start: number, stop: number, step: number) =>
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step);

const options = ref<any>(null);

const props = defineProps({
  modelValue: {
    default: new Date().getFullYear(),
  },
  selectEmpty: {
    type: Boolean,
    default: false,
  },
  allowEmpty: {
    type: String,
    default: null,
  },
});

const currentYear = new Date().getFullYear();
const YEARS = range(currentYear, currentYear - 50, -1).map(function (val) {
  return { label: val, id: val };
});

const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);

setValues();

function setValues() {
  if (modelValue.value && typeof modelValue.value !== 'object') {
    setOptions(modelValue.value);
  } else setOptions();
}

function setOptions(id: string | number = 0) {
  if (props.allowEmpty) {
    options.value = [{ label: t(props.allowEmpty), value: null }, ...YEARS];
  } else {
    options.value = YEARS;
  }
  if (props.selectEmpty && (id === 0 || !id)) {
    modelValue.value = options.value[0];
  } else if (id === 0 || !id) {
    if (props.allowEmpty) {
      modelValue.value = options.value[1];
    } else {
      modelValue.value = options.value[0];
    }
  } else {
    const res = filter(options.value, (obj) => {
      return obj.id === id;
    });
    modelValue.value = res[0];
  }
}
</script>
