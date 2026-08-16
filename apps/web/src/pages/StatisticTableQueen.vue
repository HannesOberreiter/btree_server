<script setup lang="ts">
import type { QTableProps } from 'quasar';
import { orderBy, round } from 'lodash-es';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import TableButtons from '../components/TableButtons.vue';
import TableFilter from '../components/TableFilter.vue';
import { useDateFormat } from '../composables/useDate';
import { useKeyTable } from '../composables/useKey';
import { useQueensStats } from '../composables/useQuery';

import { tableCheckSelected } from '../helpers';
import { useTableFilterStore } from '../stores/tableFilter';

const { t } = useI18n();
const useDate = useDateFormat();
const selected = ref<any>([]);
const rows = ref([]);
const modus = ref(true);
const deleted = ref(false);
const filter = ref('');
const orderLocalDirection = ref<'asc' | 'desc'>('asc');
const orderLocalName = ref('');

const storeFilter = useTableFilterStore();
const STATSSTORE = 'statistic_queen_table';
const { statistic_queen_table: filters } = storeToRefs(storeFilter);
const visibleColumns = ref([
  'queens.name',
  'hive_location.hive_name',
  'move_date',
  'last_date',
  'pollen',
  'brood',
  'temper',
  'swarm',
  'varroa',
  'strong',
  'calm_comb',
  'amount',
  'frames'
]);

const columns = [
  {
    name: 'id',
    label: t('id'),
    align: 'right',
    field: (row: any) => row.id,
    sortable: true
  },
  {
    name: 'queens.name',
    label: t('name'),
    align: 'left',
    field: (row: any) => (row.queens ? row.queens.name : ''),
    sortable: true
  },
  {
    name: 'hive_location.hive_name',
    label: t('hive'),
    align: 'left',
    field: (row: any) => (row.hive_location ? row.hive_location.hive_name : ''),
    format: (val, row) =>
      row.hive_location
        ? row.hive_location.hive_modus
          ? val
          : `${val} (${t('inactive')})`
        : val,
    sortable: true
  },
  {
    name: 'move_date',
    label: t('dateStart'),
    align: 'center',
    field: (row: any) => row.move_date,
    format: v => useDate.displayFormat(v),
    sortable: true
  },
  {
    name: 'last_date',
    label: t('dateEnd'),
    align: 'center',
    field: (row: any) => row.last_date,
    format: (v, row) =>
      row.hive_location
        ? row.hive_location.hive_modus
          ? useDate.displayFormat(v)
          : '-'
        : '',
    sortable: false
  },
  {
    type: 'checkup',
    name: 'brood',
    label: t('rating.brood'),
    align: 'right',
    field: (row: any) => row.checkup.brood,
    format: v => round(v, 1),
    sortable: false
  },
  {
    type: 'checkup',
    name: 'pollen',
    label: t('rating.pollen'),
    align: 'right',
    field: (row: any) => row.checkup.pollen,
    format: v => round(v, 1),
    sortable: false
  },
  {
    type: 'checkup',
    name: 'temper',
    label: t('rating.temper'),
    align: 'right',
    field: (row: any) => row.checkup.temper,
    format: v => round(v, 1),
    sortable: false
  },
  {
    type: 'checkup',
    name: 'calm_comb',
    label: t('rating.calm_comb'),
    align: 'right',
    field: (row: any) => row.checkup.calm_comb,
    format: v => round(v, 1),
    sortable: false
  },
  {
    type: 'checkup',
    name: 'swarm',
    label: t('rating.swarm'),
    align: 'right',
    field: (row: any) => row.checkup.swarm,
    format: v => round(v, 1),
    sortable: false
  },
  {
    type: 'checkup',
    name: 'varroa',
    label: t('varroa'),
    align: 'right',
    field: (row: any) => row.checkup.varroa,
    format: v => round(v, 1),
    sortable: false
  },
  {
    type: 'checkup',
    name: 'strong',
    label: t('strong'),
    align: 'right',
    field: (row: any) => row.checkup.strong,
    format: v => round(v, 1),
    sortable: false
  },
  {
    type: 'harvest',
    name: 'amount',
    label: t('harvest'),
    align: 'right',
    field: (row: any) => row.harvest.amount,
    format: v => round(v, 1),
    sortable: false
  },
  {
    type: 'harvest',
    name: 'frames',
    label: t('frame', 2),
    align: 'right',
    field: (row: any) => row.harvest.frames,
    format: v => round(v, 1),
    sortable: false
  }
] as QTableProps['columns'];

const pagination = ref({
  sortBy: 'move_date',
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0
});
useKeyTable(pagination);

const {
  isLoading: isLoadingTable,
  data,
  refetch
} = useQueensStats({
  order: computed(() => [pagination.value.sortBy]),
  direction: computed(() => (pagination.value.descending ? ['desc'] : ['asc'])),
  offset: computed(() => pagination.value.page - 1),
  limit: computed(() => pagination.value.rowsPerPage),
  filters: computed(() => (filters?.value ? filters.value : '')),
  q: computed(() => (filter.value ? filter.value : ''))
});

watch(
  data,
  () => {
    if (data.value) {
      rows.value = data.value.results;
      pagination.value.rowsNumber = data.value.total;
      selected.value = tableCheckSelected(selected.value, rows.value);
    }
    orderLocalName.value = '';
    orderLocalDirection.value = 'asc';
  },
  {
    immediate: true
  }
);

function onRequest(props: any) {
  pagination.value = props.pagination;
}

function orderLocalData(o: any) {
  rows.value = orderBy(
    rows.value,
    v => {
      if (v[o.type][o.name]) {
        return v[o.type][o.name];
      }
      return '';
    },
    orderLocalDirection.value
  );
  orderLocalDirection.value =
    orderLocalDirection.value === 'asc' ? 'desc' : 'asc';
  orderLocalName.value = o.name;
}
</script>

<template>
  <q-card flat>
    <div class="row q-pa-sm justify-center">
      <div class="col-12">
        <div class="text-h5 text-center">
          {{ $t('statistic') }} {{ $t('queen', 2) }}
        </div>
        <div class="text-caption text-center">
          {{ $t('hintStatisticTableQueen') }}
        </div>
      </div>
    </div>
    <q-card-section>
      <q-table
        v-model:pagination="pagination"
        v-model:selected="selected"
        :visible-columns="visibleColumns"
        :rows="rows"
        :columns="columns"
        :loading="isLoadingTable"
        :dense="true"
        :rows-per-page-options="[10, 50, 100, 500, 10000]"
        separator="vertical"
        row-key="id"
        selection="multiple"
        binary-state-sort
        flat
        bordered
        @request="onRequest"
      >
        <template #top-left>
          <TableButtons
            v-model:deleted="deleted"
            v-model:modus="modus"
            :selected="selected"
            :table="STATSSTORE"
            @change="refetch"
          />
        </template>
        <template #top-right>
          <TableFilter
            v-model:model-filter="filter"
            v-model:model-visible="visibleColumns"
            :columns="columns"
          />
        </template>
        <template #header-cell-brood="props">
          <q-th
            :props="props"
            :class="orderLocalName === props.col.name ? 'text-amber-10' : ''"
            @click="orderLocalData(props.col)"
          >
            {{ props.col.label }}
          </q-th>
        </template>
        <template #header-cell-pollen="props">
          <q-th
            :props="props"
            :class="orderLocalName === props.col.name ? 'text-amber-10' : ''"
            @click="orderLocalData(props.col)"
          >
            {{ props.col.label }}
          </q-th>
        </template>

        <template #header-cell-temper="props">
          <q-th
            :props="props"
            :class="orderLocalName === props.col.name ? 'text-amber-10' : ''"
            @click="orderLocalData(props.col)"
          >
            {{ props.col.label }}
          </q-th>
        </template>

        <template #header-cell-calm_comb="props">
          <q-th
            :props="props"
            :class="orderLocalName === props.col.name ? 'text-amber-10' : ''"
            @click="orderLocalData(props.col)"
          >
            {{ props.col.label }}
          </q-th>
        </template>

        <template #header-cell-swarm="props">
          <q-th
            :props="props"
            :class="orderLocalName === props.col.name ? 'text-amber-10' : ''"
            @click="orderLocalData(props.col)"
          >
            {{ props.col.label }}
          </q-th>
        </template>

        <template #header-cell-varroa="props">
          <q-th
            :props="props"
            :class="orderLocalName === props.col.name ? 'text-amber-10' : ''"
            @click="orderLocalData(props.col)"
          >
            {{ props.col.label }}
          </q-th>
        </template>

        <template #header-cell-strong="props">
          <q-th
            :props="props"
            :class="orderLocalName === props.col.name ? 'text-amber-10' : ''"
            @click="orderLocalData(props.col)"
          >
            {{ props.col.label }}
          </q-th>
        </template>
        <template #header-cell-amount="props">
          <q-th
            :props="props"
            :class="orderLocalName === props.col.name ? 'text-amber-10' : ''"
            @click="orderLocalData(props.col)"
          >
            {{ props.col.label }}
          </q-th>
        </template>
        <template #header-cell-frames="props">
          <q-th
            :props="props"
            :class="orderLocalName === props.col.name ? 'text-amber-10' : ''"
            @click="orderLocalData(props.col)"
          >
            {{ props.col.label }}
          </q-th>
        </template>
      </q-table>
    </q-card-section>
  </q-card>
</template>
