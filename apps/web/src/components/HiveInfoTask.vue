<template>
  <global-loading v-if="isLoading"></global-loading>
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
            {{ result.name }}:&nbsp;
            <span v-if="result.amount_sum > 0">
              {{ round(result.amount_sum, 1) }}
            </span>
            <!-- Frames -->
            <span v-if="props.kind === 'harvest'">
              <span v-if="result.frames_sum > 0">
                &nbsp;({{ $t('frame', 2) }}: {{ result.frames_sum }})
              </span>
            </span>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { round, chain } from 'lodash-es';
import { useStatisticTable } from '~/composables/useQuery';

const props = defineProps({
  id: {
    required: true,
  },
  kind: {
    type: String,
    default: 'harvest',
  },
});

const id = toRef(props, 'id');
const filter = computed(() => JSON.stringify([{ hive_id: id.value }]));
const results = ref(null);
const years = ref(null);

const { isLoading, data } = useStatisticTable(props.kind, {
  order: ['year'],
  direction: ['desc'],
  groupByType: true,
  filters: filter,
});

watch(
  data,
  () => {
    if (data.value) {
      if (data.value.results) {
        results.value = chain(data.value.results)
          .sortBy('year', 'asc')
          .groupBy('year')
          .value();
        years.value = Object.keys(results.value).sort().reverse();
      }
    }
  },
  { immediate: true }
);
</script>
