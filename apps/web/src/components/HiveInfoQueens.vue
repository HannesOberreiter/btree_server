<template>
  <global-loading v-if="isLoading"></global-loading>
  <div v-else-if="data.results">
    <b>{{ $t('queen', 2) }}</b>
    <span v-if="data.results.length === 5"> ({{ $t('max') }} 5)</span>:
    <span v-for="(item, index) in data.results" :key="item.id">
      <b>{{ item.name }}</b> ({{ useDate.isoFormat(item.date) }})
      <span v-if="index + 1 !== data.results.length">, </span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { useDateFormat } from '~/composables/useDate';
import { useQueensQuery } from '~/composables/useQuery';

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
  { immediate: true }
);

const { isLoading, data } = useQueensQuery({
  limit: 5,
  order: ['queens.date'],
  direction: ['desc'],
  filters: filter,
});
</script>
