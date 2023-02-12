<template>
  <q-input
    v-if="table !== 'option'"
    v-model="modelFilter"
    borderless
    dense
    debounce="300"
    placeholder="Search"
  >
    <template #append>
      <q-icon name="fas fa-magnifier" />
    </template>
  </q-input>
  <q-select
    v-model="modelVisible"
    multiple
    outlined
    dense
    options-dense
    emit-value
    :options="optionColumns"
    option-value="name"
    :display-value="$q.lang.table.columns"
    options-cover
    style="min-width: 150px"
  />
</template>

<script setup lang="ts">
import { QTableProps } from 'quasar';
import { PropType } from 'vue';
import { useVModels } from '@vueuse/core';
import { toRef, computed } from 'vue';

const props = defineProps({
  modelFilter: {
    type: String,
    required: true,
  },
  modelVisible: {
    type: Object as PropType<Array<string>>,
    required: true,
  },
  columns: {
    type: Object as PropType<QTableProps['columns']>,
    required: true,
  },
  table: {
    type: String,
    default: '',
  },
});

const columns = toRef(props, 'columns');
const emit = defineEmits(['update:modelFilter', 'update:modelVisible']);
const { modelFilter, modelVisible } = useVModels(props, emit);

const optionColumns = computed(() => {
  return columns.value.filter((obj) => (!obj.required ? obj : null));
});
</script>
