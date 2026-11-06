<script setup lang="ts">
import { ref, toRef, watch } from 'vue';
import { useDateFormat } from '../composables/useDate';
import { useMovementsQuery } from '../composables/useQuery';
import GlobalLoading from './GlobalLoading.vue';

const props = defineProps({
  id: {
    required: true
  }
});
const useDate = useDateFormat();
const id = toRef(props, 'id');
const filter = ref<any>(null);

watch(
  id,
  () => {
    filter.value = JSON.stringify([{ 'movedates.hive_id': id.value }]);
  },
  { immediate: true }
);

const { isLoading, data } = useMovementsQuery({
  limit: 5,
  order: ['movedates.date'],
  direction: ['desc'],
  filters: filter
});
</script>

<template>
  <GlobalLoading v-if="isLoading" />
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
