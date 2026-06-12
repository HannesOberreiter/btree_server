<script setup lang="ts">
import type { QTableProps } from 'quasar';
import { round } from 'lodash-es';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import TableButtons from '../components/TableButtons.vue';
import TableColNote from '../components/TableColNote.vue';
import TableColUrl from '../components/TableColUrl.vue';
import TableFilter from '../components/TableFilter.vue';
import TableThSum from '../components/TableThSum.vue';
import { useDateFormat } from '../composables/useDate';
import { useKeyTable } from '../composables/useKey';
import { useChargeQuery } from '../composables/useQuery';
import { tableCheckSelected, tableMeta } from '../helpers';
import { useTableFilterStore } from '../stores/tableFilter';
import { useTablesStore } from '../stores/tables';

const useDate = useDateFormat();
const { t } = useI18n();

const storeTable = useTablesStore();
const storeFilter = useTableFilterStore();
const { charge: store } = storeToRefs(storeTable);
const { charge: filters } = storeToRefs(storeFilter);

const visibleColumns = ref(store.value.visible);

const selected = ref<any>([]);
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
    sortable: true
  },
  {
    name: 'date',
    label: t('date'),
    align: 'left',
    field: (row: any) => row.date,
    format: (val: string) => useDate.displayFormat(val),
    sortable: true
  },
  {
    name: 'bestbefore',
    label: t('bestbefore'),
    align: 'left',
    field: (row: any) => row.bestbefore,
    format: (val: string) => useDate.displayFormat(val),
    sortable: true
  },
  {
    name: 'name',
    label: t('description'),
    align: 'left',
    field: (row: any) => row.name,
    format: (val: string) => val,
    sortable: true
  },
  {
    name: 'amount',
    label: t('amount'),
    align: 'right',
    field: (row: any) => row.amount,
    format: (val: string) => val,
    sortable: true
  },
  {
    name: 'type.name',
    label: t('type'),
    align: 'left',
    field: (row: any) => (row.type ? row.type.name : ''),
    format: (val: string, row: any) =>
      !row.type ? val : row.type.unit ? `${val} (${row.type.unit})` : val,
    sortable: true
  },

  {
    name: 'type:stock:sum',
    label: t('stock'),
    align: 'right',
    field: (row: any) =>
      row.type ? (row.type.stock ? row.type.stock.sum : '') : '',
    format: (val: number) => round(val, 2),
    sortable: true
  },
  {
    name: 'charge',
    label: t('chargeNumber'),
    align: 'left',
    field: (row: any) => row.charge,
    format: (val: string) => val,
    sortable: true
  },

  {
    name: 'price',
    label: t('price'),
    align: 'right',
    field: (row: any) => row.price,
    sortable: true
  },
  {
    name: 'kind',
    label: t('kind'),
    align: 'center',
    field: (row: any) => row.kind,
    format: (val: string) => t(val),
    sortable: true
  },
  {
    name: 'url',
    label: t('url'),
    align: 'left',
    field: (row: any) => row.url,
    sortable: true
  },
  {
    name: 'note',
    label: t('note'),
    align: 'left',
    field: (row: any) => row.note,
    sortable: true
  },
  {
    name: 'created_at',
    label: t('created'),
    align: 'center',
    field: (row: any) => row.created_at,
    format: (val: string, row: any) =>
      tableMeta(val, row.creator, useDate.formats.value['date-time']),
    sortable: true
  },
  {
    name: 'updated_at',
    label: t('updated'),
    align: 'center',
    field: (row: any) => row.updated_at,
    format: (val: string, row: any) =>
      tableMeta(val, row.editor, useDate.formats.value['date-time']),
    sortable: true
  },
  {
    name: 'deleted_at',
    label: t('deleted'),
    align: 'center',
    field: (row: any) => row.deleted_at,
    format: (val: string, row: any) =>
      row.deleted
        ? tableMeta(val, row.editor, useDate.formats.value['date-time'])
        : '',
    sortable: true
  }
] as QTableProps['columns'];

const pagination = ref({
  sortBy: store.value.sort,
  descending: store.value.direction,
  page: 1,
  rowsPerPage: store.value.length,
  rowsNumber: 0
});
useKeyTable(pagination);

const {
  isLoading: isLoadingTable,
  data,
  refetch
} = useChargeQuery({
  order: computed(() => [pagination.value.sortBy]),
  direction: computed(() => (pagination.value.descending ? ['asc'] : ['desc'])),
  offset: computed(() => pagination.value.page - 1),
  limit: computed(() => pagination.value.rowsPerPage),
  q: computed(() => (filter.value ? filter.value : '')),
  filters: computed(() => (filters?.value ? filters.value : '')),
  deleted
});

watch(visibleColumns, cur => {
  store.value.visible = cur as any;
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
    immediate: true
  }
);

function onRequest(props: any) {
  store.value.length = props.pagination.rowsPerPage;
  store.value.sort = props.pagination.sortBy;
  store.value.direction = props.pagination.descending;
  pagination.value = props.pagination;
}
</script>

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
        flat
        bordered
        @request="onRequest"
      >
        <template #top-left>
          <TableButtons
            v-model:deleted="deleted"
            v-model:modus="modus"
            :selected="selected"
            table="charge"
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
        <template #header-cell-amount="props">
          <TableThSum
            :parent-prop="props"
            :label="props.col.label"
            :name="props.col.name"
            :selected="selected"
          />
        </template>
        <template #body-cell-url="props">
          <TableColUrl :value="props.value" />
        </template>
        <template #body-cell-note="props">
          <TableColNote
            :value="props.value"
            :trunc="visibleColumns.length > 4"
          />
        </template>
      </q-table>
    </div>
  </div>
</template>
