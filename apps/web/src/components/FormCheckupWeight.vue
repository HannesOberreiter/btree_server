<template>
  <div class="row">
    <div class="col-12 col-md-6">
      <form-input-numeric
        v-model="modelValue"
        :reset="reset"
        :values="values"
        label="weight"
        icon="fas fa-weight"
      ></form-input-numeric>
    </div>
    <div class="col-12 col-md-6">
      <form-input-time
        v-model="modelTime"
        :reset="reset"
        :values="values"
      ></form-input-time>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModels } from '@vueuse/core';
import type { PropType } from 'vue';
import FormInputNumeric from './FormInputNumeric.vue';
import FormInputTime from './FormInputTime.vue';

const props = defineProps({
  modelValue: {
    default: 0,
  },
  modelTime: {
    type: null as unknown as PropType<string | null>,
    required: true,
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
const emit = defineEmits(['update:modelValue', 'update:modelTime']);
const { modelValue, modelTime } = useVModels(props, emit);
</script>
