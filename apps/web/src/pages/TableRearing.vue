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
        <template #body-cell-rearing_event="props">
          <table-col-rearing-event :id="props.value"></table-col-rearing-event>
        </template>

        <template #body-cell-symbol="props">
          <table-col-symbol :value="props.value"></table-col-symbol>
        </template>

        <template #body-cell-note="props">
          <table-col-note
            :value="props.value"
            :trunc="visibleColumns.length > 4"
          ></table-col-note>
        </template>

        <template #top-left>
          <table-buttons
            v-model:deleted="deleted"
            v-model:modus="modus"
            :selected="selected"
            table="rearing"
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
import { tableCheckSelected, tableMeta } from '~/helpers';
import { useRearingsQuery } from '~/composables/useQuery';
import { useTablesStore } from '~/stores/tables';
import { useTableFilterStore } from '~/stores/tableFilter';
import { QTableProps } from 'quasar';
import { useDateFormat } from '~/composables/useDate';
import { useKeyTable } from '~/composables/useKey';

const useDate = useDateFormat();
const { t } = useI18n();
const storeTable = useTablesStore();
const storeFilter = useTableFilterStore();
const { rearing: store } = storeToRefs(storeTable);
const { rearing: filters } = storeToRefs(storeFilter);

const visibleColumns = ref(store.value.visible);

const selected = ref([]);
const rows = ref([]);
const modus = ref(true);
const deleted = ref(false);
const filter = ref('');

const columns = [
  {
    name: 'rearing_event',
    label: t('timetable'),
    align: 'center',
    field: (row: any) => row.id,
    sortable: false,
    required: true,
  },
  {
    name: 'id',
    label: t('id'),
    align: 'right',
    field: (row: any) => row.id,
    sortable: true,
  },
  {
    name: 'symbol',
    label: t('symbol'),
    align: 'center',
    field: (row: any) => row.symbol,
    sortable: true,
  },
  {
    name: 'name',
    label: t('name'),
    align: 'left',
    field: (row: any) => row.name,
    sortable: true,
  },
  {
    name: 'date',
    label: t('date'),
    align: 'left',
    field: (row: any) => row.date,
    format: (val: string) => useDate.isoFormat(val, 'date-time'),
    sortable: true,
  },
  {
    name: 'type.name',
    label: t('method'),
    align: 'left',
    field: (row: any) => (row.type ? row.type.name : ''),
    sortable: true,
  },
  {
    name: 'start.job',
    label: t('rear.startLabel'),
    align: 'left',
    field: (row: any) => (row.start ? row.start.job : ''),
    sortable: true,
  },
  {
    name: 'larvae',
    label: t('larvae'),
    align: 'left',
    field: (row: any) => row.larvae,
    sortable: true,
  },
  {
    name: 'hatch',
    label: t('hatch'),
    align: 'left',
    field: (row: any) => row.hatch,
    sortable: true,
  },
  {
    name: 'mated',
    label: t('mated'),
    align: 'left',
    field: (row: any) => row.mated,
    sortable: true,
  },
  {
    name: 'note',
    label: t('note'),
    align: 'left',
    field: (row: any) => row.note,
    sortable: false,
  },
  {
    name: 'created_at',
    label: t('created'),
    align: 'center',
    field: (row: any) => row.created_at,
    format: (val: string, row: any) => tableMeta(val, row.creator),
    sortable: true,
  },
  {
    name: 'updated_at',
    label: t('updated'),
    align: 'center',
    field: (row: any) => row.updated_at,
    format: (val: string, row: any) => tableMeta(val, row.editor),
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
} = useRearingsQuery({
  order: computed(() => [pagination.value.sortBy]),
  direction: computed(() => (pagination.value.descending ? ['asc'] : ['desc'])),
  offset: computed(() => pagination.value.page - 1),
  limit: computed(() => pagination.value.rowsPerPage),
  q: computed(() => (filter.value ? filter.value : '')),
  filters: computed(() => (filters.value ? filters.value : '')),
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
