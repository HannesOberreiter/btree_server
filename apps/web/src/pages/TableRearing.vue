<script setup lang="ts">
import type { QTableProps } from 'quasar';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import TableButtons from '../components/TableButtons.vue';
import TableColNote from '../components/TableColNote.vue';
import TableColRearingEvent from '../components/TableColRearingEvent.vue';
import TableColSymbol from '../components/TableColSymbol.vue';
import TableFilter from '../components/TableFilter.vue';
import { useDateFormat } from '../composables/useDate';

import { useKeyTable } from '../composables/useKey';
import { useRearingsQuery } from '../composables/useQuery';
import { tableCheckSelected, tableMeta } from '../helpers';
import { useTableFilterStore } from '../stores/tableFilter';
import { useTablesStore } from '../stores/tables';

const useDate = useDateFormat();
const { t } = useI18n();
const storeTable = useTablesStore();
const storeFilter = useTableFilterStore();
const { rearing: store } = storeToRefs(storeTable);
const { rearing: filters } = storeToRefs(storeFilter);

const visibleColumns = ref(store.value.visible);

const selected = ref<any>([]);
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
    required: true
  },
  {
    name: 'id',
    label: t('id'),
    align: 'right',
    field: (row: any) => row.id,
    sortable: true
  },
  {
    name: 'symbol',
    label: t('symbol'),
    align: 'center',
    field: (row: any) => row.symbol,
    sortable: true
  },
  {
    name: 'name',
    label: t('name'),
    align: 'left',
    field: (row: any) => row.name,
    sortable: true
  },
  {
    name: 'date',
    label: t('date'),
    align: 'left',
    field: (row: any) => row.date,
    format: (val: string) => useDate.displayFormat(val, 'date-time'),
    sortable: true
  },
  {
    name: 'type.name',
    label: t('method'),
    align: 'left',
    field: (row: any) => (row.type ? row.type.name : ''),
    sortable: true
  },
  {
    name: 'start.job',
    label: t('rear.startLabel'),
    align: 'left',
    field: (row: any) => (row.start ? row.start.job : ''),
    sortable: true
  },
  {
    name: 'larvae',
    label: t('larvae'),
    align: 'left',
    field: (row: any) => row.larvae,
    sortable: true
  },
  {
    name: 'hatch',
    label: t('hatch'),
    align: 'left',
    field: (row: any) => row.hatch,
    sortable: true
  },
  {
    name: 'mated',
    label: t('mated'),
    align: 'left',
    field: (row: any) => row.mated,
    sortable: true
  },
  {
    name: 'note',
    label: t('note'),
    align: 'left',
    field: (row: any) => row.note,
    sortable: false
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
} = useRearingsQuery({
  order: computed(() => [pagination.value.sortBy]),
  direction: computed(() => (pagination.value.descending ? ['desc'] : ['asc'])),
  offset: computed(() => pagination.value.page - 1),
  limit: computed(() => pagination.value.rowsPerPage),
  q: computed(() => (filter.value ? filter.value : '')),
  filters: computed(() => (filters?.value ? filters.value : ''))
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
        <template #body-cell-rearing_event="props">
          <TableColRearingEvent :id="props.value" />
        </template>

        <template #body-cell-symbol="props">
          <TableColSymbol :value="props.value" />
        </template>

        <template #body-cell-note="props">
          <TableColNote
            :value="props.value"
            :trunc="visibleColumns.length > 4"
          />
        </template>

        <template #top-left>
          <TableButtons
            v-model:deleted="deleted"
            v-model:modus="modus"
            :selected="selected"
            table="rearing"
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
      </q-table>
    </div>
  </div>
</template>
