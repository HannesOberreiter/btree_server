<template>
  <form-input-text
    v-model="modelValue"
    label="markColor"
    :values="values"
    :reset="reset"
    icon="fas fa-marker"
  >
    <template #deepAfter>
      <div class="bg-dark q-pl-xs q-pr-xs">
        <q-icon
          :color="color"
          name="fas fa-circle"
          style="cursor: pointer"
          @click="setValue"
        ></q-icon>
      </div>
    </template>
  </form-input-text>
</template>

<script lang="ts">
import dayjs from 'dayjs';

function queenColor(cur: string) {
  const last = dayjs(cur).format('YYYY').slice(-1);

  if (last == '0' || last == '5') {
    var colour = 'blue';
  } else if (last == '1' || last == '6') {
    var colour = 'white';
  } else if (last == '2' || last == '7') {
    var colour = 'yellow';
  } else if (last == '3' || last == '8') {
    var colour = 'red';
  } else {
    var colour = 'green';
  }
  return colour;
}
</script>

<script setup lang="ts">
import { useVModels } from '@vueuse/core';

const { t } = useI18n();
const props = defineProps({
  modelValue: {
    default: '',
  },
  date: {
    default: dayjs().format('YYYY-MM-DD'),
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
