<template>
  <global-loading v-if="isLoading"></global-loading>
  <div v-else-if="data.results">
    <div>
      <b>{{ $t('movement', 2) }}</b>
      <span v-if="data.results.length === 5">({{ $t('max') }} 5)</span>
    </div>
    <ul>
      <li v-for="item in data.results" :key="item.id">
        {{ useDate.displayFormat(item.date) }}
        <span v-if="item.apiary">
          &nbsp;<b>({{ item.apiary.name }})</b>
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useDateFormat } from '~/composables/useDate';
import { useMovementsQuery } from '~/composables/useQuery';

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
    filter.value = JSON.stringify([{ 'movedates.hive_id': id.value }]);
  },
  { immediate: true },
);

const { isLoading, data } = useMovementsQuery({
  limit: 5,
  order: ['movedates.date'],
  direction: ['desc'],
  filters: filter,
});
</script>
