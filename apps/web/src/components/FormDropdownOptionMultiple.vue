<script setup lang="ts">
import type { PropType } from 'vue';
import type { Option } from '../types';
import { useVModels } from '@vueuse/core';
import { filter } from 'lodash-es';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  useApiariesQuery,
  useHivesQuery,
  useOptionsQuery,
  useQueensQuery,
  useRearingDetailsQuery,
  useScaleQuery
} from '../composables/useQuery';
import { deepUnref } from '../helpers/deep-unref';

const props = defineProps({
  modelValue: {
    type: Array as PropType<any[]>,
    default: () => []
  },
  label: {
    default: 'type'
  },
  table: {
    type: String as PropType<Option>,
    required: true
  },
  tableId: {
    default: 'type_id'
  },
  showBefore: {
    default: true
  }
});
const emit = defineEmits(['update:modelValue']);
const { t } = useI18n();
const hint = ref('');
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

const { modelValue } = useVModels(props, emit);
const options = ref([] as any);
const keepOptions = ref([] as any);

watch(
  [data],
  () => {
    setValues();
  },
  {
    immediate: true
  }
);

function setValues() {
  if (modelValue.value) {
    setOptions(deepUnref(modelValue.value));
  } else {
    setOptions();
  }
  keepOptions.value = options.value;
}

function setOptions(id: number[] = []) {
  if (!data.value) {
    return;
  }
  options.value = data.value.results;
  if (id.length === 0) {
    modelValue.value = [];
  } else if (id === null) {
    modelValue.value = [];
  } else {
    const res = filter(options.value, obj => {
      return obj.id === id.find(c => c === obj.id);
    });
    if (res.length === 0) {
      options.value = [
        { label: t('dropdownNotAvailable'), value: null },
        ...options.value
      ];
      hint.value = t('dropdownNotAvailable');
      modelValue.value = [options.value[0]];
    } else {
      modelValue.value = res;
    }
  }
}

function filterSelection(val: string, update: any, abort: any) {
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

  if (options.value !== null) {
    update(
      () => {
        const needle = new RegExp(`(${val.toLowerCase()})`);
        options.value = filter(options.value, obj => {
          if (!obj.name) {
            return;
          }
          if (obj.name) {
            return needle.test(obj.name.toLowerCase());
          }
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
</script>

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
    use-input
    :use-chips="!$q.platform.is.mobile"
    filled
    class="q-pb-sm"
    @filter="filterSelection"
  >
    <template v-if="showBefore" #before>
      <q-icon name="far fa-square-caret-down" />
    </template>
  </q-select>
</template>
