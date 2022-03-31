<template>
  <form-input-text
    v-model="modelValue"
    :values="values"
    :reset="reset"
    label="url"
    readonly
    :max-valid="512"
  >
    <template #deepAfter>
      <q-icon name="fab fa-dropbox" style="cursor: pointer"></q-icon>
    </template>
  </form-input-text>
</template>

<script setup lang="ts">
import { useVModels } from '@vueuse/core';
import FormInputText from './FormInputText.vue';

const props = defineProps({
  modelValue: {
    default: '',
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
</script>
