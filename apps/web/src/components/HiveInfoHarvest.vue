<template>
  <global-loading v-if="isLoading"></global-loading>
  <div v-else-if="data.results">
    <b>{{ $t('harvest', 2) }}</b>
    {{ data }}
  </div>
</template>

<script setup lang="ts">
import { useStatisticHiveQuery } from '~/composables/useQuery';

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
    filter.value = JSON.stringify([{ 'hives.id': id.value }]);
  },
  { immediate: true }
);

const { isLoading, data } = useStatisticHiveQuery('harvest', {
  filters: filter,
});
</script>
