<template>
  <form-input-text
    v-model="modelValue"
    label="mark_colour"
    :values="values"
    :reset="reset"
    icon="fas fa-marker"
  >
    <template #deepAfter>
      <div>
        <btn-base
          color="grey"
          :text-color="color"
          icon="fas fa-circle"
          size="xs"
          :dense="true"
          :fab-mini="true"
          @click="setValue"
        >
          <tooltip-base>{{ $t('colour') }}: {{ $t(color) }}</tooltip-base>
        </btn-base>
      </div>
    </template>
  </form-input-text>
</template>

<script lang="ts">
function queenColor(cur: string) {
  const last = cur
    ? cur.slice(3, 4)
    : new Date().getFullYear().toString().slice(-1);
  let colour = 'green';
  if (last == '0' || last == '5') {
    colour = 'blue';
  } else if (last == '1' || last == '6') {
    colour = 'white';
  } else if (last == '2' || last == '7') {
    colour = 'yellow';
  } else if (last == '3' || last == '8') {
    colour = 'red';
  }
  return colour;
}
</script>

<script setup lang="ts">
import { useVModels } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import { computed, toRef } from 'vue';
import TooltipBase from './TooltipBase.vue';
import BtnBase from './BtnBase.vue';
import FormInputText from './FormInputText.vue';

const { t } = useI18n();
const props = defineProps({
  modelValue: {
    default: '',
  },
  date: {
    default: new Date('YYYY-MM-DD').toString(),
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
const date = toRef(props, 'date');

const color = computed(() => queenColor(date.value));

function setValue() {
  modelValue.value = t(color.value);
}
</script>
