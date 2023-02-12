<template>
  <q-select
    v-model="modelValue"
    :label="$t(label)"
    :name="label"
    :loading="isLoading"
    :disable="isLoading"
    :options="options"
    :hint="hint"
    :multiple="true"
    :clearable="true"
    option-value="id"
    filled
    class="q-pb-sm"
  >
    <template v-if="showBefore" #before>
      <q-icon name="far fa-square-caret-down"></q-icon>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { filter } from 'lodash-es';
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
import { useVModels } from '@vueuse/core';
import { deepUnref } from '~/helpers/deep-unref';
import { useI18n } from 'vue-i18n';
import { ref, watch } from 'vue';

const { t } = useI18n();
const hint = ref('');
const props = defineProps({
  modelValue: {
    default: [],
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
const options = ref([] as any);

watch(
  [data],
  () => {
    setValues();
  },
  {
    immediate: true,
  }
);

function setValues() {
  if (modelValue.value) {
    setOptions(deepUnref(modelValue.value));
  } else setOptions();
}

function setOptions(id = <Array<number>>[]) {
  if (!data.value) return;
  options.value = data.value.results;
  if (id.length === 0) modelValue.value = [];
  else if (id === null) modelValue.value = [];
  else {
    const res = filter(options.value, (obj) => {
      return obj.id === id.find((c) => c === obj.id);
    });
    if (res.length === 0) {
      options.value = [
        { label: t('dropdownNotAvailable'), value: null },
        ...options.value,
      ];
      hint.value = t('dropdownNotAvailable');
      modelValue.value = [options.value[0]];
    } else {
      modelValue.value = res;
    }
  }
}
</script>
