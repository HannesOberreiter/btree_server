<template>
  <global-loading v-if="isLoading"></global-loading>
  <div v-else-if="data.results">
    <div>
      <b>{{ $t('queen', 2) }}</b>
      <span v-if="data.results.length === 5"> ({{ $t('max') }} 5)</span>
    </div>
    <ul>
      <li v-for="item in data.results" :key="item.id">
        <b>{{ item.name }}</b>
        &nbsp;({{ useDate.isoFormat(item.date) }})
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useDateFormat } from '~/composables/useDate';
import { useQueensQuery } from '~/composables/useQuery';

import { toRef, ref, watch } from 'vue';

const useDate = useDateFormat();
const props = defineProps({
  id: {
    required: true,
  },
});
const id = toRef(props, 'id');
const filter = ref(null);

watch(
  id,
  () => {
    filter.value = JSON.stringify([{ 'queens.hive_id': id.value }]);
  },
  { immediate: true },
);

const { isLoading, data } = useQueensQuery({
  limit: 5,
  order: ['queens.date'],
  direction: ['desc'],
  filters: filter,
});
</script>
