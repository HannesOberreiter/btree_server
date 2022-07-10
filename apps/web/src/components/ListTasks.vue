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
        v-for="task in listData.slice(
          taskStart,
          apiary ? taskEnd : listData.length
        )"
        :key="task.kind + task.id"
        bordered
        class="rounded-borders"
      >
        <item-task
          :default-opened="opened"
          :opened="opened"
          :task="task"
          :apiary="apiary"
          @refetch="refetch()"
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
  apiary: {
    default: false,
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
const { id, year, filter, opened, apiary } = toRefs(props);
const { isLoading, data, refetch } = useHiveTaskQuery({
  id: id,
  year: year,
  apiary: apiary,
});
const taskStart = ref(0);
const taskEnd = ref(10);

const listData = computed(() => {
  if (data.value) {
    taskStart.value = 0;
    taskEnd.value = 10;
    return buildList(data.value, filter.value);
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
