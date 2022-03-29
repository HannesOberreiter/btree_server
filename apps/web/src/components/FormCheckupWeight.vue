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
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import FormInputNumeric from './FormInputNumeric.vue';
import FormInputTime from './FormInputTime.vue';

dayjs.extend(customParseFormat); // Needed to validate if date is even possible
const props = defineProps({
  modelValue: {
    default: 0,
  },
  modelTime: {
    default: dayjs().format('HH:mm'),
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
