<template>
  <input-numeric
    v-model="modelValue"
    :values="values"
    :reset="reset"
    icon="fas fa-bug"
    label="varroa"
  >
    <template #deepAfter>
      <q-icon
        name="fas fa-calculator"
        style="cursor: pointer"
        @click="openCalculator"
      ></q-icon>
    </template>
  </input-numeric>
</template>

<script setup lang="ts">
import { useVModels } from '@vueuse/core';
import { useQuasar } from 'quasar';
import DialogVarroa from './DialogVarroa.vue';

const $q = useQuasar();
const props = defineProps({
  modelValue: {
    default: 0,
  },
  reset: {
    type: Number,
    default: 0,
  },
  values: {
    type: Object,
    default: null,
  },
});
const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);

function openCalculator() {
  $q.dialog({
    component: DialogVarroa,
    componentProps: {
      value: modelValue.value,
    },
  }).onOk((e) => {
    modelValue.value = e;
  });
}
</script>
