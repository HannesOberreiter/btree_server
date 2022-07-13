<template>
  <global-loading v-if="isLoading"></global-loading>
  <div v-else-if="data">
    <div>
      <b> {{ $t('harvest', 2) }}</b>
    </div>
    <ul>
      <li v-for="year in sumArray" :key="year[0]">
        <span>
          <b>{{ year[0] }}:&nbsp;</b>
          {{ year[1].total_amount }}
          <q-tooltip>
            {{ `${$t('quarter')}: ${year[1].quarter_amount}` }}
          </q-tooltip>
        </span>
        <!-- Frames -->
        <span v-if="year[1].total_frames > 0">
          &nbsp;({{ $t('frame', 2) }}: {{ year[1].total_frames }})
          <q-tooltip>
            {{
              `${$t('quarter')} ${$t('frame', 2)}: ${year[1].quarter_frames}`
            }}
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
        total_frames: sum(v, (d) => d.sum_frames),
        quarter_amount: map(
          v,
          (d) => ` (${d.quarter}) ${d.sum_amount}`
        ).toString(),
        quarter_frames: map(
          v,
          (d) => ` (${d.quarter}) ${d.sum_frames}`
        ).toString(),
      };
    },
    (d: any) => d.year
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

const { isLoading, data } = useStatisticHiveQuery('harvest', {
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
