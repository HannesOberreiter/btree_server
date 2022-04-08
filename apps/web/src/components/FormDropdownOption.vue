<template>
  <q-select
    v-model="modelValue"
    :label="disable ? $t(label) + ' - ' + $t('multipleValues') : $t(label)"
    :name="label"
    :loading="isLoading"
    :disable="isLoading || disable"
    :options="options"
    :hint="hint"
    option-value="id"
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
import { filter, isEmpty } from 'lodash-es';
import { Option } from '~/types';
import { PropType } from 'vue';
import {
  useApiariesQuery,
  useHivesQuery,
  useOptionsQuery,
  useQueensQuery,
} from '~/composables/useQuery';
import { useVModels } from '@vueuse/core';
import BtnMultipleValues from './BtnMultipleValues.vue';
import { formCheckMultipleValues } from '~/helpers';

const { t } = useI18n();
const hint = ref('');
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
  tableId: {
    default: 'type_id',
  },
  reset: {
    type: Number,
    default: 0,
  },
  values: {
    type: Object,
    default: null,
  },
  allowEmpty: {
    type: String,
    default: '',
  },
});

const { isLoading, data } =
  props.table === 'apiary'
    ? useApiariesQuery({})
    : props.table === 'hive'
    ? useHivesQuery({})
    : props.table === 'queen'
    ? useQueensQuery({ modus: null })
    : useOptionsQuery(props.table, {});

const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);
const { values, reset } = toRefs(props);
const multipleValues = computed(() =>
  formCheckMultipleValues(values.value, props.tableId)
);
const disable = ref(multipleValues.value);
const options = ref([] as any);

watch(
  [data, values, reset],
  () => {
    setValues();
  },
  {
    immediate: true,
  }
);

function setValues() {
  disable.value = multipleValues.value;

  if (values.value && !isEmpty(values.value)) {
    setOptions(values.value[0][props.tableId]);
  } else if (modelValue.value && typeof modelValue.value !== 'object') {
    setOptions(modelValue.value);
  } else setOptions();
}

function setOptions(id = 0) {
  if (!data.value) return;
  if (props.allowEmpty !== '') {
    options.value = [
      { label: t(props.allowEmpty), value: null },
      ...data.value.results,
    ];
  } else {
    options.value = data.value.results;
  }
  if (multipleValues.value) editValues(true);
  else if (id === 0) modelValue.value = options.value[0];
  else {
    const res = filter(data.value.results, (obj) => {
      return obj.id === id;
    });
    if (res.length === 0) hint.value = t('dropdownNotAvailable');
    modelValue.value = res[0];
  }
}

function editValues(val: boolean) {
  disable.value = val;
  modelValue.value = disable.value ? null : modelValue.value;
}
</script>
