<template>
  <div class="row q-pa-sm justify-center">
    <div class="col-12">
      <q-table
        v-model:pagination="pagination"
        v-model:selected="selected"
        :rows="rows"
        :columns="columns"
        :visible-columns="visibleColumns"
        :loading="isLoadingTable"
        :dense="true"
        :rows-per-page-options="[10, 50, 100, 500, 10000]"
        separator="vertical"
        row-key="id"
        selection="multiple"
        binary-state-sort
        @request="onRequest"
      >
        <template #top-left>
          <table-buttons
            v-model:deleted="deleted"
            v-model:modus="modus"
            :selected="selected"
            table="chargeStock"
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
      </q-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { tableCheckSelected } from '~/helpers';
import { useChargeStockQuery } from '~/composables/useQuery';
import { useTablesStore } from '~/stores/tables';
import { QTableProps } from 'quasar';
import { useKeyTable } from '~/composables/useKey';

const { t } = useI18n();

const storeTable = useTablesStore();
const { chargeStock: store } = storeToRefs(storeTable);

const visibleColumns = ref(store.value.visible);

const selected = ref([]);
const rows = ref([]);
const modus = ref(true);
const deleted = ref(false);
const filter = ref('');

const columns = [
  {
    name: 'id',
    label: t('id'),
    align: 'right',
    field: (row: any) => row.id,
    sortable: true,
  },
  {
    name: 'sum',
    label: t('stock'),
    align: 'right',
    field: (row: any) => row.sum,
    format: (val: string) => val,
    sortable: true,
  },
  {
    name: 'name',
    label: t('type'),
    align: 'left',
    field: (row: any) => row.name,
    format: (val: string, row: any) =>
      row.unit ? val + ' (' + row.unit + ')' : val,
    sortable: true,
  },
  {
    name: 'sum_in',
    label: t('in'),
    align: 'right',
    field: (row: any) => row.sum_in,
    format: (val: string) => val,
    sortable: true,
  },
  {
    name: 'sum_out',
    label: t('out'),
    align: 'right',
    field: (row: any) => row.sum_out,
    format: (val: string) => val,
    sortable: true,
  },
] as QTableProps['columns'];

const pagination = ref({
  sortBy: store.value.sort,
  descending: store.value.direction,
  page: 1,
  rowsPerPage: store.value.length,
  rowsNumber: 0,
});
useKeyTable(pagination);

const {
  isLoading: isLoadingTable,
  data,
  refetch,
} = useChargeStockQuery({
  order: computed(() => [pagination.value.sortBy]),
  direction: computed(() => (pagination.value.descending ? ['asc'] : ['desc'])),
  offset: computed(() => pagination.value.page - 1),
  limit: computed(() => pagination.value.rowsPerPage),
  q: computed(() => (filter.value ? filter.value : '')),
});

watch(visibleColumns, (cur) => {
  store.value.visible = cur;
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
  store.value.length = props.pagination.rowsPerPage;
  store.value.sort = props.pagination.sortBy;
  store.value.direction = props.pagination.descending;
  pagination.value = props.pagination;
}
</script>
