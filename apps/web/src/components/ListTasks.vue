<template>
  <global-loading v-if="isLoading"></global-loading>
  <div v-else class="row justify-center">
    <div v-if="!listData" class="col-12 text-center text-h6">
      {{ $t('error.noData') }}
    </div>
    <div v-else-if="listData.length === 0" class="col-12 text-center text-h6">
      {{ $t('error.noData') }}
    </div>
    <div v-else class="col-12">
      <q-list
        v-for="task in listData"
        :key="task.kind + task.id"
        bordered
        class="rounded-borders"
      >
        <item-task
          :default-opened="opened"
          :task="task"
          @refetch="refetch()"
        ></item-task>
      </q-list>
    </div>
  </div>
</template>

<script lang="ts">
import { orderBy } from 'lodash';

function buildList(data: any, filter: string) {
  if (filter !== 'filterEmpty') {
    return data[filter];
  } else {
    const array: any[] = [];
    for (const prop in data) {
      array.push(...data[prop]);
    }
    const sortedArray = orderBy(
      array,
      function (o) {
        return new Date(o.date);
      },
      'desc'
    );
    return sortedArray;
  }
}
</script>

<script setup lang="ts">
import { useHiveTaskQuery } from '~/composables/useQuery';

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  filter: {
    type: String,
    required: true,
  },
  opened: {
    default: false,
  },
});
const { id, year, filter, opened } = toRefs(props);
const { isLoading, data, refetch } = useHiveTaskQuery({ id: id, year: year });

const listData = computed(() => {
  if (data.value) {
    return buildList(data.value, filter.value);
  } else {
    return null;
  }
});
</script>
