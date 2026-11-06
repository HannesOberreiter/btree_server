<script setup lang="ts">
import type { PropType } from 'vue';
import { useVModels } from '@vueuse/core';
import { filter, isEmpty, map } from 'lodash-es';
import { computed, ref, toRefs, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDateFormat } from '../composables/useDate';
import { useRearingTypesQuery } from '../composables/useQuery';
import { formCheckMultipleValues } from '../helpers';
import BtnMultipleValues from './BtnMultipleValues.vue';

const props = defineProps({
  modelValue: {
    type: Object as PropType<any>,
    default: null
  },
  modelDetail: {
    type: Object as PropType<any>,
    default: null
  },
  modelDate: {
    type: String,
    default: null
  },
  reset: {
    type: Number,
    default: 0
  },
  values: {
    type: Object,
    default: null
  },
  allowEmpty: {
    type: String,
    default: ''
  }
});
const emit = defineEmits(['update:modelValue', 'update:modelDetail']);
const { t } = useI18n();
const useDate = useDateFormat();

const { isLoading, data } = useRearingTypesQuery({});

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
const hintDetail = ref('');

watch(
  [data, values, reset],
  () => {
    setValues();
  },
  {
    immediate: true
  }
);

watch(modelValue, cur => {
  if (cur) {
    filterStepOption();
  }
});

function setValues() {
  disable.value = multipleValues.value;
  if (values.value && !isEmpty(values.value)) {
    setOptions(values.value[0].type_id);
  } else if (modelValue.value && typeof modelValue.value !== 'object') {
    setOptions(modelValue.value);
  } else {
    setOptions();
  }
}

function setValuesDetail() {
  disableDetail.value = multipleValuesDetail.value;
  if (values.value && !isEmpty(values.value)) {
    setOptionsDetail(values.value[0].detail_id);
  } else if (modelDetail.value && typeof modelDetail.value !== 'object') {
    setOptionsDetail(modelDetail.value);
  } else {
    setOptionsDetail();
  }
}

function setOptions(id = 0) {
  if (!data.value) {
    return;
  }
  if (props.allowEmpty !== '') {
    options.value = [
      { label: t(props.allowEmpty), value: null },
      ...data.value.results
    ];
  } else {
    options.value = data.value.results;
  }
  if (multipleValues.value) {
    editValues(true);
  } else if (id === 0) {
    modelValue.value = options.value[0];
  } else {
    const res = filter(data.value.results, obj => {
      return obj.id === id;
    });
    hint.value = res.length === 0 ? t('dropdownNotAvailable') : '';
    modelValue.value = res[0];
  }
}

function filterStepOption() {
  const filtered = filter(data.value.results, { id: modelValue.value.id })[0];
  optionsDetail.value = map(filtered.step, o => {
    return {
      value: o.detail_id,
      label: o.detail.job,
      ...o
    };
  });
  setValuesDetail();
}

function setOptionsDetail(id = 0) {
  if (!data.value) {
    return;
  }
  if (multipleValuesDetail.value) {
    editValuesDetail(true);
  } else if (id === 0) {
    modelDetail.value = unref(optionsDetail.value[0]);
  } else {
    const res = filter(optionsDetail.value, obj => {
      return obj.detail_id === id;
    });
    hintDetail.value = res.length === 0 ? t('dropdownNotAvailable') : '';
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

<template>
  <div>
    <q-select
      v-model="modelValue"
      :label="
        disable ? `${$t('method')} - ${$t('multipleValues')}` : $t('method')
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
        <q-icon v-if="!multipleValues" name="far fa-square-caret-down" />
        <BtnMultipleValues
          v-else
          :disable="disable"
          @click="editValues(!disable)"
        />
      </template>
    </q-select>
    <q-select
      v-if="!multipleValues"
      v-model="modelDetail"
      :label="
        disableDetail
          ? `${$t('rear.startLabel')} - ${$t('multipleValues')}`
          : $t('rear.startLabel')
      "
      name="start"
      :loading="isLoading"
      :disable="isLoading || disableDetail"
      :options="optionsDetail"
      :hint="
        hintDetail
          ? hintDetail
          : $t('rear.startHint', {
              step: modelDetail ? modelDetail.label : '',
              date: useDate.displayFormat(modelDate, 'date-time')
            })
      "
      option-value="detail_id"
      filled
      class="q-pb-lg"
    >
      <template #before>
        <q-icon v-if="!multipleValuesDetail" name="far fa-square-caret-down" />
        <BtnMultipleValues
          v-else
          :disable="disableDetail"
          @click="editValuesDetail(!disableDetail)"
        />
      </template>
    </q-select>
  </div>
</template>
