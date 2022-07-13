<template>
  <global-loading v-if="isLoading"></global-loading>
  <div v-else-if="data">
    <div>
      <b> {{ $t('feed', 2) }}</b>
    </div>
    <ul>
      <li v-for="year in sumArray" :key="year[0]">
        <b>{{ year[0] }}:&nbsp;</b>
        <span v-for="(type, index) in year[1]" :key="type[0]">
          {{ type[0] }}<b>&nbsp;{{ type[1].total_amount }}</b>
          <span v-if="index + 1 !== year[1].length">,&nbsp;</span>
          <q-tooltip>
            {{ `${$t('quarter')}: ${type[1].quarter_amount}` }}
          </q-tooltip>
        </span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { rollups, sum, map } from 'd3-array';
import { round } from 'lodash';

function calculateSum(obj: any) {
  const total = rollups(
    obj,
    (v) => {
      return {
        total_amount: sum(v, (d) => round(d.sum_amount, 1)),
        quarter_amount: map(
          v,
          (d) => ` (${d.quarter}) ${d.sum_amount}`
        ).toString(),
      };
    },
    (d: any) => d.year,
    (d: any) => d.type_name
  );
  return total;
}
</script>

<script setup lang="ts">
import { useStatisticHiveQuery } from '~/composables/useQuery';

const props = defineProps({
  id: {
    required: true,
  },
});
const id = toRef(props, 'id');
const filter = ref(null);
const sumArray = ref([]);

watch(
  id,
  () => {
    filter.value = JSON.stringify([{ hive_id: id.value }]);
  },
  { immediate: true }
);

const { isLoading, data } = useStatisticHiveQuery('feed', {
  filters: filter,
});

watch(
  data,
  (cur) => {
    if (cur) sumArray.value = calculateSum(cur);
  },
  { immediate: true }
);
</script>
