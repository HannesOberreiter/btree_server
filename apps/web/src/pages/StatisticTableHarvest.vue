<template>
  <q-card>
    <div class="row q-pa-sm justify-center">
      <div class="col-12">
        <div class="text-h5 text-center">
          {{ $t('statistic') }} {{ $t('harvest') }}
        </div>
        <div class="text-caption text-center q-pb-sm">
          {{ $t('hintStatisticHarvestTable') }}
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
        :row-key="(row) => row.hive_id + '-' + row.year"
        selection="multiple"
        binary-state-sort
        @request="onRequest"
      >
        <template #top-left>
          <table-buttons
            v-model:deleted="deleted"
            v-model:modus="modus"
            :selected="selected"
            table="statistic"
            @change="refetch"
          ></table-buttons>
        </template>
        <template #top-right>
          <table-filter
            v-model:modelFilter="filter"
            v-model:modelVisible="visibleColumns"
            :columns="columns"
          ></table-filter>
        </template>
        <template #header-cell-amount_sum="props">
          <table-th-sum
            :label="props.col.label"
            :name="props.col.name"
            :selected="selected"
          ></table-th-sum>
        </template>
        <template #header-cell-frames_sum="props">
          <table-th-sum
            :label="props.col.label"
            :name="props.col.name"
            :selected="selected"
          ></table-th-sum>
        </template>
      </q-table>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { round } from 'lodash';
import { QTableProps } from 'quasar';
import { useStatisticTableHarvest } from '~/composables/useQuery';
import { tableCheckSelected } from '~/helpers';
import { useTableFilterStore } from '~/stores/tableFilter';

const { t } = useI18n();
const selected = ref([]);
const rows = ref([]);
const modus = ref(true);
const deleted = ref(false);
const filter = ref('');
const storeFilter = useTableFilterStore();
storeFilter.reset('statistic');
const { statistic: filters } = storeToRefs(storeFilter);
const visibleColumns = ref(['year', 'hive.name', 'amount_sum', 'frames_sum']);

const columns = [
  {
    name: 'hive_id',
    label: t('id'),
    align: 'right',
    field: (row: any) => row.hive_id,
    sortable: true,
  },
  {
    name: 'year',
    label: t('year'),
    align: 'right',
    field: (row: any) => row.year,
    sortable: true,
  },
  {
    name: 'hive.name',
    label: t('hive'),
    align: 'left',
    field: (row: any) => (row.hive ? row.hive.name : ''),
    sortable: true,
  },
  {
    name: 'amount_sum',
    label: t('sum') + ' ' + t('amount'),
    align: 'right',
    field: (row: any) => row.amount_sum,
    format: (v) => round(v, 1),
    sortable: true,
  },
  {
    name: 'amount_avg',
    label: t('average') + ' ' + t('amount'),
    align: 'right',
    field: (row: any) => row.amount_avg,
    format: (v) => round(v, 1),
    sortable: true,
  },
  {
    name: 'frames_sum',
    label: t('sum') + ' ' + t('frame', 2),
    align: 'right',
    field: (row: any) => row.frames_sum,
    format: (v) => round(v, 1),
    sortable: true,
  },
  {
    name: 'frames_avg',
    label: t('average') + ' ' + t('frame', 2),
    align: 'right',
    field: (row: any) => row.frames_avg,
    format: (v) => round(v, 1),
    sortable: true,
  },
  {
    name: 'water_avg',
    label: t('average') + ' ' + t('water'),
    align: 'right',
    field: (row: any) => row.water_avg,
    format: (v) => round(v, 1),
    sortable: true,
  },
] as QTableProps['columns'];

const pagination = ref({
  sortBy: 'year',
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const {
  isLoading: isLoadingTable,
  data,
  refetch,
} = useStatisticTableHarvest({
  order: computed(() => [pagination.value.sortBy]),
  direction: computed(() => (pagination.value.descending ? ['asc'] : ['desc'])),
  offset: computed(() => pagination.value.page - 1),
  limit: computed(() => pagination.value.rowsPerPage),
  filters: computed(() => (filters.value ? filters.value : '')),
  q: computed(() => (filter.value ? filter.value : '')),
});

watch(
  data,
  () => {
    if (data.value) {
      rows.value = data.value.results;
      pagination.value.rowsNumber = data.value.total;
      selected.value = tableCheckSelected(selected.value, rows.value);
    }
  },
  {
    immediate: true,
  }
);

function onRequest(props: any) {
  pagination.value = props.pagination;
}
</script>
