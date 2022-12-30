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
    :use-input="table === 'charge_types' && localPerf['charge-use-input']"
    filled
    class="q-pb-sm"
    @filter="filterSelection"
  >
    <template v-if="showBefore" #before>
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
  useRearingDetailsQuery,
  useScaleQuery,
} from '~/composables/useQuery';
import { useLocalStorage, useVModels } from '@vueuse/core';
import { formCheckMultipleValues } from '~/helpers';

const localPerf = useLocalStorage(
  'pref-local',
  { 'charge-use-input': false },
  { mergeDefaults: true }
);

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
  filterEmpty: {
    type: String,
    default: '',
  },
  showBefore: {
    default: true,
  },
});

const { isLoading, data } =
  props.table === 'apiary'
    ? useApiariesQuery({})
    : props.table === 'hive'
    ? useHivesQuery({})
    : props.table === 'queen'
    ? useQueensQuery({ modus: null })
    : props.table === 'scale'
    ? useScaleQuery({})
    : props.table === 'rearing_detail'
    ? useRearingDetailsQuery({})
    : useOptionsQuery(props.table, {});

const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);
const { values, reset } = toRefs(props);
const multipleValues = computed(() =>
  formCheckMultipleValues(values.value, props.tableId)
);
const disable = ref(multipleValues.value);
const options = ref([] as any);
const keepOptions = ref([] as any);

watch(
  [data, values, reset],
  () => {
    setValues();
  },
  {
    immediate: true,
  }
);

function filterSelection(val: any, update: any, _abort: any) {
  if (values.value !== null) {
    update(() => {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      const needle = new RegExp(`(${val.toLowerCase()})`);
      options.value = filter(options.value, (obj) =>
        needle.test(obj.name.toLowerCase())
      );
    });
  }
  if (val === '') {
    update(() => {
      options.value = keepOptions.value;
    });
    return;
  }
}

function setValues() {
  disable.value = multipleValues.value;
  if (values.value && !isEmpty(values.value)) {
    setOptions(values.value[0][props.tableId]);
  } else if (modelValue.value && typeof modelValue.value !== 'object') {
    setOptions(modelValue.value);
  } else setOptions();
  keepOptions.value = options.value;
}

function setOptions(id = 0) {
  if (!data.value) return;
  if (props.allowEmpty !== '' && props.filterEmpty !== '') {
    options.value = [
      { label: t(props.allowEmpty), value: null },
      { label: t(props.filterEmpty), id: 'empty' },
      ...data.value.results,
    ];
  } else if (props.allowEmpty !== '') {
    options.value = [
      { label: t(props.allowEmpty), value: null },
      ...data.value.results,
    ];
  } else if (props.filterEmpty !== '') {
    options.value = [
      { label: t(props.filterEmpty), id: 'empty' },
      ...data.value.results,
    ];
  } else {
    options.value = data.value.results;
  }
  if (multipleValues.value) editValues(true);
  else if (id === 0) modelValue.value = options.value[0];
  else if (id === null) modelValue.value = options.value[0];
  else {
    const res = filter(options.value, (obj) => {
      return obj.id === id;
    });
    if (res.length === 0) {
      options.value = [
        { label: t('dropdownNotAvailable'), value: null },
        ...options.value,
      ];
      hint.value = t('dropdownNotAvailable');
      modelValue.value = options.value[0];
    } else {
      modelValue.value = res[0];
    }
  }
}

function editValues(val: boolean) {
  disable.value = val;
  modelValue.value = disable.value ? null : modelValue.value;
}
</script>
