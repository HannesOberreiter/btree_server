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
    :use-input="localPerf[`dropdown-${table}-use-input`]"
    :clearable="localPerf[`dropdown-${table}-use-input`]"
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
    <template #after>
      <q-btn
        icon="fas fa-keyboard"
        flat
        round
        dense
        :class="localPerf[`dropdown-${table}-use-input`] ? 'text-green-8' : ''"
        @click="
          localPerf[`dropdown-${table}-use-input`] =
            !localPerf[`dropdown-${table}-use-input`]
        "
      >
        <tooltip-base>{{ t('allowKeyboardOnSelection') }}</tooltip-base>
      </q-btn>
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
import { useI18n } from 'vue-i18n';
import { ref, watch, toRefs, computed } from 'vue';
import { useQuasar } from 'quasar';

import DialogForm from './DialogForm.vue';
import { OPTIONS } from '~/constants';

const $q = useQuasar();

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

const localPerf = useLocalStorage(
  'pref-local',
  { 'charge-use-input': false, [`dropdown-${props.table}-use-input`]: false },
  { mergeDefaults: true }
);

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

watch(modelValue, () => {
  if (modelValue.value && typeof modelValue.value === 'object') {
    if (modelValue.value.value === 'addOption') {
      onNewOptionDialog();
    }
  }
});

function onNewOptionDialog() {
  $q.dialog({
    component: DialogForm,
    componentProps: {
      title: 'add',
      form: 'option',
      option: props.table,
    },
  }).onDismiss(() => {
    setValues();
  });
}

function filterSelection(val: string, update: any, abort: any) {
  if (!localPerf.value[`dropdown-${props.table}-use-input`]) abort();
  if (val === '') {
    update(
      () => {
        options.value = keepOptions.value;
      },
      (modelValue: any) => {
        if (
          modelValue.options.length > 0 &&
          modelValue.getOptionIndex() === -1
        ) {
          modelValue.moveOptionSelection(1, true);
          modelValue.toggleOption(
            modelValue.options[modelValue.optionIndex],
            true
          );
        }
      }
    );
    return;
  }

  if (values.value !== null) {
    update(
      () => {
        const needle = new RegExp(`(${val.toLowerCase()})`);
        options.value = filter(options.value, (obj) => {
          if (!obj.name) return;
          if (obj.name) return needle.test(obj.name.toLowerCase());
          return;
        });
      },
      (modelValue: any) => {
        if (
          modelValue.options.length > 0 &&
          modelValue.getOptionIndex() === -1
        ) {
          modelValue.moveOptionSelection(1, true);
          modelValue.toggleOption(
            modelValue.options[modelValue.optionIndex],
            true
          );
        }
      }
    );

    abort(() => {
      console.log('abort');
    });
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

function setNewOptionPlaceholder() {
  if (!OPTIONS.includes(props.table as any)) return;
  options.value = [
    ...options.value,
    { label: `[${t('addOption')}]`, value: 'addOption' },
  ];
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
  setNewOptionPlaceholder();
}

function editValues(val: boolean) {
  disable.value = val;
  modelValue.value = disable.value ? null : modelValue.value;
}
</script>
