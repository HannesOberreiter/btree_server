<script setup lang="ts">
import type { StatisticKind, StatisticResponse } from '../api/types';
import type { PropType } from 'vue';
import { groupBy, round, sortBy } from 'lodash-es';
import { computed, ref, toRef, watch } from 'vue';
import { useStatisticTable } from '../composables/useQuery';
import GlobalLoading from './GlobalLoading.vue';

const props = defineProps({
  id: {
    type: [Number, String],
    required: true
  },
  kind: {
    type: String as PropType<StatisticKind>,
    default: 'harvest'
  }
});

const id = toRef(props, 'id');
const filter = computed(() =>
  JSON.stringify([{ hive_id_array: [Number(id.value)] }])
);
const results = ref<Record<string, StatisticResponse[]> | null>(null);
const years = ref<string[]>([]);

const { isLoading, data } = useStatisticTable(props.kind, {
  order: ['year'],
  direction: ['desc'],
  groupByType: true,
  filters: filter
});

watch(
  data,
  () => {
    if (data.value) {
      if (data.value.results) {
        const groupedResults = groupBy(
          sortBy(data.value.results, 'year', 'asc'),
          'year'
        );
        results.value = groupedResults;
        years.value = Object.keys(groupedResults).sort().reverse();
      }
    }
  },
  { immediate: true }
);
</script>

<template>
  <GlobalLoading v-if="isLoading" />
  <div v-else-if="data">
    <div>
      <b> {{ $t(props.kind, 2) }}</b>
    </div>
    <ul v-if="results">
      <li v-for="year in years" :key="year">
        <span>
          <b>{{ year }}</b>
        </span>
        <ul>
          <li v-for="(result, index) in results[year]" :key="index">
            {{ result.type?.name }}:&nbsp;
            <span v-if="Number(result.amount_sum) > 0">
              {{ round(Number(result.amount_sum), 1) }}
            </span>
            <!-- Frames -->
            <span v-if="props.kind === 'harvest'">
              <span v-if="Number(result.frames_sum) > 0">
                &nbsp;({{ $t('frame', 2) }}: {{ result.frames_sum }})
              </span>
            </span>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>
