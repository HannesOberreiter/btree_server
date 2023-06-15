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
        v-for="(task, index) in listData.slice(
          taskStart,
          apiary ? taskEnd : listData.length
        )"
        :key="task.kind + task.id"
        bordered
        class="borders"
        :class="index > 0 ? 'border-top-none' : ''"
      >
        <item-task
          :default-opened="opened"
          :opened="opened"
          :task="task"
          :apiary="apiary"
          @refetch="refetchQuery()"
        ></item-task>
      </q-list>
      <span v-if="apiary" class="text-caption">
        {{ $t('task', 2) }}: {{ taskStart + 1 }} -
        {{ taskEnd > listData.length ? listData.length : taskEnd }}
      </span>
      &nbsp;
      <span class="text-caption">
        {{ $t('total') }}: {{ listData.length }}
      </span>
      <div v-if="apiary" class="float-right">
        <btn-base :disable="taskStart < 10" @click="taskPrevious">
          {{ $t('previous') }}
        </btn-base>
        <btn-base :disable="taskEnd >= listData.length" @click="taskNext">
          {{ $t('next') }}
        </btn-base>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { orderBy } from 'lodash';
import { Filter, FilterState } from '~/types';

import ItemTask from './ItemTask.vue';

import { watch, ref, toRefs, computed } from 'vue';

function buildList(data: any, filter: Filter, filterState: FilterState) {
  let array: any[] =
    filter !== 'filterEmpty'
      ? data[filter]
      : (Object.values(data).flat() as any[]);

  if (filterState !== 'both') {
    array = array.filter((o) => {
      if (o.kind === 'movedate') {
        if (filterState === 'done') {
          return new Date() >= new Date(o.date);
        } else {
          return new Date() < new Date(o.date);
        }
      }
      if (filterState === 'done') {
        return o.done === true;
      } else {
        return o.done === false;
      }
    });
  }
  const sortedArray = orderBy(array, ['date'], 'desc');
  return sortedArray;
}
</script>

<script setup lang="ts">
import { useHiveTaskQuery } from '~/composables/useQuery';
import { PropType } from 'vue';

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  apiary: {
    default: false,
  },
  year: {
    type: Number,
    required: true,
  },
  filter: {
    type: String as PropType<Filter>,
    required: true,
  },
  filterState: {
    type: String as PropType<FilterState>,
    required: true,
  },
  opened: {
    default: false,
  },
  refetch: {
    default: 0,
  },
});
const {
  id,
  year,
  filter,
  filterState,
  opened,
  apiary,
  refetch: doRefetch,
} = toRefs(props);
const {
  isLoading,
  data,
  refetch: refetchQuery,
} = useHiveTaskQuery({
  id: id,
  year: year,
  apiary: apiary,
});
const taskStart = ref(0);
const taskEnd = ref(10);

watch(doRefetch, () => refetchQuery.value());

const listData = computed(() => {
  if (data.value) {
    // eslint-disable-next-line vue/no-side-effects-in-computed-properties
    taskStart.value = 0;
    // eslint-disable-next-line vue/no-side-effects-in-computed-properties
    taskEnd.value = 10;
    return buildList(data.value, filter.value, filterState.value);
  } else {
    return null;
  }
});

const taskNext = () => {
  if (taskEnd.value > listData.value.length) {
    taskStart.value = listData.value.length - 10;
    taskEnd.value = listData.value.length;
  } else {
    taskStart.value = taskStart.value + 10;
    taskEnd.value = taskEnd.value + 10;
  }
};

const taskPrevious = () => {
  if (taskStart.value - 10 < 10) {
    taskStart.value = 0;
    taskEnd.value = 10;
  } else {
    taskStart.value = taskStart.value - 10;
    taskEnd.value = taskEnd.value - 10;
  }
};
</script>
