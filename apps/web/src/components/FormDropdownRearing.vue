<template>
  <div>
    <q-select
      v-model="modelValue"
      :label="
        disable ? $t('method') + ' - ' + $t('multipleValues') : $t('method')
      "
      name="type"
      :loading="isLoading"
      :disable="isLoading || disable"
      :options="options"
      option-value="id"
      :hint="hint"
      filled
      class="q-pb-md"
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
    <q-select
      v-model="modelDetail"
      :label="
        disableDetail ? $t('start') + ' - ' + $t('multipleValues') : $t('start')
      "
      name="start"
      :loading="isLoading"
      :disable="isLoading || disableDetail"
      :options="optionsDetail"
      :hint="
        $t('rear.startHint', {
          step: modelDetail ? modelDetail.label : '',
          date: useDate.displayFormat(modelDate, 'date-time'),
        })
      "
      option-value="detail_id"
      filled
      class="q-pb-md"
    >
      <template #before>
        <q-icon
          v-if="!multipleValuesDetail"
          name="far fa-square-caret-down"
        ></q-icon>
        <btn-multiple-values
          v-else
          :disable="disableDetail"
          @click="editValuesDetail(!disableDetail)"
        ></btn-multiple-values>
      </template>
    </q-select>
  </div>
</template>

<script setup lang="ts">
import { filter, isEmpty, map } from 'lodash-es';
import { useRearingTypesQuery } from '~/composables/useQuery';
import { useVModels } from '@vueuse/core';
import BtnMultipleValues from './BtnMultipleValues.vue';
import { formCheckMultipleValues } from '~/helpers';
import { useDateFormat } from '~/composables/useDate';

const { t } = useI18n();
const useDate = useDateFormat();

const props = defineProps({
  modelValue: {
    default: null,
  },
  modelDetail: {
    default: null,
  },
  modelDate: {
    default: null,
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

const { isLoading, data } = useRearingTypesQuery({});

const emit = defineEmits(['update:modelValue', 'update:modelDetail']);
const { modelValue, modelDetail, modelDate } = useVModels(props, emit);
const { values, reset } = toRefs(props);
const multipleValues = computed(() =>
  formCheckMultipleValues(values.value, 'type_id')
);
const multipleValuesDetail = computed(() =>
  formCheckMultipleValues(values.value, 'detail_id')
);
const disable = ref(multipleValues.value);
const disableDetail = ref(multipleValues.value);

const options = ref<any>([]);
const optionsDetail = ref<any>([]);
const hint = ref('');

watch(
  [data, values, reset],
  () => {
    setValues();
  },
  {
    immediate: true,
  }
);

watch(modelValue, (cur) => {
  if (cur) filterStepOption();
});

watch(modelDetail, (cur) => {
  console.log(cur);
});

function setValues() {
  disable.value = multipleValues.value;
  if (values.value && !isEmpty(values.value)) {
    setOptions(values.value[0]['type_id']);
  } else if (modelValue.value && typeof modelValue.value !== 'object') {
    setOptions(modelValue.value);
  } else setOptions();
}

function setValuesDetail() {
  disableDetail.value = multipleValuesDetail.value;
  if (values.value && !isEmpty(values.value)) {
    setOptionsDetail(values.value[0]['detail_id']);
  } else if (modelDetail.value && typeof modelDetail.value !== 'object') {
    setOptionsDetail(modelDetail.value);
  } else setOptionsDetail();
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

function filterStepOption() {
  const filtered = filter(data.value.results, { id: modelValue.value.id })[0];
  optionsDetail.value = map(filtered.step, (o) => {
    return {
      value: o.detail_id,
      label: o.detail.job,
      ...o,
    };
  });
  setValuesDetail();
}

function setOptionsDetail(id = 0) {
  if (!data.value) return;
  if (multipleValuesDetail.value) editValuesDetail(true);
  else if (id === 0) {
    console.log(id);
    modelDetail.value = unref(optionsDetail.value[0]);
    console.log(optionsDetail.value[0]);
    console.log(modelDetail.value);
  } else {
    const res = filter(data.value.results, (obj) => {
      return obj.id === id;
    });
    if (res.length === 0) hint.value = t('dropdownNotAvailable');
    modelDetail.value = res[0];
  }
}

function editValues(val: boolean) {
  disable.value = val;
  modelValue.value = disable.value ? null : modelValue.value;
}

function editValuesDetail(val: boolean) {
  disableDetail.value = val;
  modelDetail.value = disableDetail.value ? null : modelDetail.value;
}
</script>
