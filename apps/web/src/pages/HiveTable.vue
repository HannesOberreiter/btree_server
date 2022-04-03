<template>
  <div class="row q-pa-sm justify-center">
    <div class="col-12">
      <q-table
        v-model:pagination="pagination"
        :title="$t('hive', 2)"
        :rows="rows"
        :columns="columns"
        row-key="id"
        :loading="isLoadingTable"
        binary-state-sort
        :dense="$q.screen.lt.md"
        :rows-per-page-options="[10, 50, 100, 500, 10000]"
        @request="onRequest"
      >
        <template #top-right>
          <q-input
            v-model="filter"
            borderless
            dense
            debounce="300"
            placeholder="Search"
          >
            <template #append>
              <q-icon name="fas fa-magnifier" />
            </template>
          </q-input>
        </template>
      </q-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { useHivesQuery } from '~/composables/useQuery';
const { t } = useI18n();

const columns = [
  {
    name: 'name',
    required: true,
    label: t('hive'),
    align: 'left',
    field: (row: any) => row.name,
    format: (val: string) => `${val}`,
    sortable: true,
  },
  {
    name: 'apiary_name',
    required: true,
    label: t('apiary'),
    align: 'left',
    field: (row: any) => row.hive_location.apiary_name,
    format: (val: string, row: any) =>
      `${val} (${dayjs(row.hive_location.movedate.date).format('YYYY-MM-DD')})`,
    sortable: true,
  },
  {
    name: 'hive_source.name',
    required: true,
    label: t('source'),
    align: 'left',
    field: (row: any) => row.hive_source.name,
    format: (val: string) => val,
    sortable: true,
  },
  {
    name: 'hive_type.name',
    required: true,
    label: t('type'),
    align: 'left',
    field: (row: any) => row.hive_type.name,
    format: (val: string) => val,
    sortable: true,
  },
];

const pagination = ref({
  sortBy: 'name',
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});
const filter = ref('');

const { isLoading: isLoadingTable, data: hives } = useHivesQuery({
  order: computed(() => [pagination.value.sortBy]),
  direction: computed(() => (pagination.value.descending ? ['asc'] : ['desc'])),
  offset: computed(() => pagination.value.page - 1),
  limit: computed(() => pagination.value.rowsPerPage),
  q: computed(() => (filter.value ? filter.value : '')),
});

function onRequest(props: any) {
  filter.value = props.filter;
  pagination.value = props.pagination;
}

const originalRows = [
  {
    id: 1,
    name: 'Frozen Yogurt',
    calories: 159,
    fat: 6.0,
    carbs: 24,
    protein: 4.0,
    sodium: 87,
    calcium: '14%',
    iron: '1%',
  },
  {
    id: 2,
    name: 'Ice cream sandwich',
    calories: 237,
    fat: 9.0,
    carbs: 37,
    protein: 4.3,
    sodium: 129,
    calcium: '8%',
    iron: '1%',
  },
  {
    id: 3,
    name: 'Eclair',
    calories: 262,
    fat: 16.0,
    carbs: 23,
    protein: 6.0,
    sodium: 337,
    calcium: '6%',
    iron: '7%',
  },
  {
    id: 4,
    name: 'Cupcake',
    calories: 305,
    fat: 3.7,
    carbs: 67,
    protein: 4.3,
    sodium: 413,
    calcium: '3%',
    iron: '8%',
  },
  {
    id: 5,
    name: 'Gingerbread',
    calories: 356,
    fat: 16.0,
    carbs: 49,
    protein: 3.9,
    sodium: 327,
    calcium: '7%',
    iron: '16%',
  },
  {
    id: 6,
    name: 'Jelly bean',
    calories: 375,
    fat: 0.0,
    carbs: 94,
    protein: 0.0,
    sodium: 50,
    calcium: '0%',
    iron: '0%',
  },
  {
    id: 7,
    name: 'Lollipop',
    calories: 392,
    fat: 0.2,
    carbs: 98,
    protein: 0,
    sodium: 38,
    calcium: '0%',
    iron: '2%',
  },
  {
    id: 8,
    name: 'Honeycomb',
    calories: 408,
    fat: 3.2,
    carbs: 87,
    protein: 6.5,
    sodium: 562,
    calcium: '0%',
    iron: '45%',
  },
  {
    id: 9,
    name: 'Donut',
    calories: 452,
    fat: 25.0,
    carbs: 51,
    protein: 4.9,
    sodium: 326,
    calcium: '2%',
    iron: '22%',
  },
  {
    id: 10,
    name: 'KitKat',
    calories: 518,
    fat: 26.0,
    carbs: 65,
    protein: 7,
    sodium: 54,
    calcium: '12%',
    iron: '6%',
  },
  {
    id: 11,
    name: 'Frozen Yogurt-1',
    calories: 159,
    fat: 6.0,
    carbs: 24,
    protein: 4.0,
    sodium: 87,
    calcium: '14%',
    iron: '1%',
  },
  {
    id: 12,
    name: 'Ice cream sandwich-1',
    calories: 237,
    fat: 9.0,
    carbs: 37,
    protein: 4.3,
    sodium: 129,
    calcium: '8%',
    iron: '1%',
  },
  {
    id: 13,
    name: 'Eclair-1',
    calories: 262,
    fat: 16.0,
    carbs: 23,
    protein: 6.0,
    sodium: 337,
    calcium: '6%',
    iron: '7%',
  },
  {
    id: 14,
    name: 'Cupcake-1',
    calories: 305,
    fat: 3.7,
    carbs: 67,
    protein: 4.3,
    sodium: 413,
    calcium: '3%',
    iron: '8%',
  },
  {
    id: 15,
    name: 'Gingerbread-1',
    calories: 356,
    fat: 16.0,
    carbs: 49,
    protein: 3.9,
    sodium: 327,
    calcium: '7%',
    iron: '16%',
  },
  {
    id: 16,
    name: 'Jelly bean-1',
    calories: 375,
    fat: 0.0,
    carbs: 94,
    protein: 0.0,
    sodium: 50,
    calcium: '0%',
    iron: '0%',
  },
  {
    id: 17,
    name: 'Lollipop-1',
    calories: 392,
    fat: 0.2,
    carbs: 98,
    protein: 0,
    sodium: 38,
    calcium: '0%',
    iron: '2%',
  },
  {
    id: 18,
    name: 'Honeycomb-1',
    calories: 408,
    fat: 3.2,
    carbs: 87,
    protein: 6.5,
    sodium: 562,
    calcium: '0%',
    iron: '45%',
  },
  {
    id: 19,
    name: 'Donut-1',
    calories: 452,
    fat: 25.0,
    carbs: 51,
    protein: 4.9,
    sodium: 326,
    calcium: '2%',
    iron: '22%',
  },
  {
    id: 20,
    name: 'KitKat-1',
    calories: 518,
    fat: 26.0,
    carbs: 65,
    protein: 7,
    sodium: 54,
    calcium: '12%',
    iron: '6%',
  },
  {
    id: 21,
    name: 'Frozen Yogurt-2',
    calories: 159,
    fat: 6.0,
    carbs: 24,
    protein: 4.0,
    sodium: 87,
    calcium: '14%',
    iron: '1%',
  },
  {
    id: 22,
    name: 'Ice cream sandwich-2',
    calories: 237,
    fat: 9.0,
    carbs: 37,
    protein: 4.3,
    sodium: 129,
    calcium: '8%',
    iron: '1%',
  },
  {
    id: 23,
    name: 'Eclair-2',
    calories: 262,
    fat: 16.0,
    carbs: 23,
    protein: 6.0,
    sodium: 337,
    calcium: '6%',
    iron: '7%',
  },
  {
    id: 24,
    name: 'Cupcake-2',
    calories: 305,
    fat: 3.7,
    carbs: 67,
    protein: 4.3,
    sodium: 413,
    calcium: '3%',
    iron: '8%',
  },
  {
    id: 25,
    name: 'Gingerbread-2',
    calories: 356,
    fat: 16.0,
    carbs: 49,
    protein: 3.9,
    sodium: 327,
    calcium: '7%',
    iron: '16%',
  },
  {
    id: 26,
    name: 'Jelly bean-2',
    calories: 375,
    fat: 0.0,
    carbs: 94,
    protein: 0.0,
    sodium: 50,
    calcium: '0%',
    iron: '0%',
  },
  {
    id: 27,
    name: 'Lollipop-2',
    calories: 392,
    fat: 0.2,
    carbs: 98,
    protein: 0,
    sodium: 38,
    calcium: '0%',
    iron: '2%',
  },
  {
    id: 28,
    name: 'Honeycomb-2',
    calories: 408,
    fat: 3.2,
    carbs: 87,
    protein: 6.5,
    sodium: 562,
    calcium: '0%',
    iron: '45%',
  },
  {
    id: 29,
    name: 'Donut-2',
    calories: 452,
    fat: 25.0,
    carbs: 51,
    protein: 4.9,
    sodium: 326,
    calcium: '2%',
    iron: '22%',
  },
  {
    id: 30,
    name: 'KitKat-2',
    calories: 518,
    fat: 26.0,
    carbs: 65,
    protein: 7,
    sodium: 54,
    calcium: '12%',
    iron: '6%',
  },
  {
    id: 31,
    name: 'Frozen Yogurt-3',
    calories: 159,
    fat: 6.0,
    carbs: 24,
    protein: 4.0,
    sodium: 87,
    calcium: '14%',
    iron: '1%',
  },
  {
    id: 32,
    name: 'Ice cream sandwich-3',
    calories: 237,
    fat: 9.0,
    carbs: 37,
    protein: 4.3,
    sodium: 129,
    calcium: '8%',
    iron: '1%',
  },
  {
    id: 33,
    name: 'Eclair-3',
    calories: 262,
    fat: 16.0,
    carbs: 23,
    protein: 6.0,
    sodium: 337,
    calcium: '6%',
    iron: '7%',
  },
  {
    id: 34,
    name: 'Cupcake-3',
    calories: 305,
    fat: 3.7,
    carbs: 67,
    protein: 4.3,
    sodium: 413,
    calcium: '3%',
    iron: '8%',
  },
  {
    id: 35,
    name: 'Gingerbread-3',
    calories: 356,
    fat: 16.0,
    carbs: 49,
    protein: 3.9,
    sodium: 327,
    calcium: '7%',
    iron: '16%',
  },
  {
    id: 36,
    name: 'Jelly bean-3',
    calories: 375,
    fat: 0.0,
    carbs: 94,
    protein: 0.0,
    sodium: 50,
    calcium: '0%',
    iron: '0%',
  },
  {
    id: 37,
    name: 'Lollipop-3',
    calories: 392,
    fat: 0.2,
    carbs: 98,
    protein: 0,
    sodium: 38,
    calcium: '0%',
    iron: '2%',
  },
  {
    id: 38,
    name: 'Honeycomb-3',
    calories: 408,
    fat: 3.2,
    carbs: 87,
    protein: 6.5,
    sodium: 562,
    calcium: '0%',
    iron: '45%',
  },
  {
    id: 39,
    name: 'Donut-3',
    calories: 452,
    fat: 25.0,
    carbs: 51,
    protein: 4.9,
    sodium: 326,
    calcium: '2%',
    iron: '22%',
  },
  {
    id: 40,
    name: 'KitKat-3',
    calories: 518,
    fat: 26.0,
    carbs: 65,
    protein: 7,
    sodium: 54,
    calcium: '12%',
    iron: '6%',
  },
];

const rows = ref([]);
const loading = ref(false);

watch(hives, () => {
  rows.value = hives.value.results;
  pagination.value.rowsNumber = hives.value.total;
});

// emulate ajax call
// SELECT * FROM ... WHERE...LIMIT...
function fetchFromServer(startRow, count, filter, sortBy, descending) {
  const data = filter
    ? originalRows.filter((row) => row.name.includes(filter))
    : originalRows.slice();

  // handle sortBy
  if (sortBy) {
    const sortFn =
      sortBy === 'desc'
        ? descending
          ? (a, b) => (a.name > b.name ? -1 : a.name < b.name ? 1 : 0)
          : (a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0)
        : descending
        ? (a, b) => parseFloat(b[sortBy]) - parseFloat(a[sortBy])
        : (a, b) => parseFloat(a[sortBy]) - parseFloat(b[sortBy]);
    data.sort(sortFn);
  }

  return data.slice(startRow, startRow + count);
}

// emulate 'SELECT count(*) FROM ...WHERE...'
function getRowsNumberCount(filter) {
  if (!filter) {
    return originalRows.length;
  }
  let count = 0;
  originalRows.forEach((treat) => {
    if (treat.name.includes(filter)) {
      ++count;
    }
  });
  return count;
}

onMounted(() => {
  // get initial data from server (1st page)
  onRequest({
    pagination: pagination.value,
    filter: undefined,
  });
});
</script>
