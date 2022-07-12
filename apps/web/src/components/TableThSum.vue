<template>
  <th>
    {{ label }} <template v-if="sum > 0">[{{ sum }}]</template>
  </th>
</template>

<script setup lang="ts">
import { round } from 'lodash-es';

const sum = ref(0);

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  selected: {
    default: [],
  },
});

const selected = toRef(props, 'selected');

watch(selected, (cur) => {
  sum.value = 0;
  if (cur) {
    if (cur.length > 0) {
      sum.value = calculateSum(cur, props.name);
    }
  } else {
  }
});

function calculateSum(values: Array<any>, col: string) {
  const arr = values.map((value) => value[col]);
  const sum = arr.reduce((total: number, num: number) => total + num);
  return round(sum, 1);
}
</script>
