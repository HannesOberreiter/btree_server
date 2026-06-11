<script lang="ts">
import { useKeyTable } from '../composables/useKey';
import { tableCheckSelected, tableMeta } from '../helpers';
</script>

<script setup lang="ts">
import type { QTableProps } from 'quasar';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import TableButtons from '../components/TableButtons.vue';
import TableColLink from '../components/TableColLink.vue';
import TableColNote from '../components/TableColNote.vue';
import TableColQueen from '../components/TableColQueen.vue';
import TableColStatus from '../components/TableColStatus.vue';
import TableFilter from '../components/TableFilter.vue';
import { useDateFormat } from '../composables/useDate';
import { useHivesQuery } from '../composables/useQuery';
import { useTableFilterStore } from '../stores/tableFilter';
import { useTablesStore } from '../stores/tables';

const useDate = useDateFormat();
const { t } = useI18n();
const storeTable = useTablesStore();
const storeFilter = useTableFilterStore();
const { hive: store } = storeToRefs(storeTable);
const { hive: filters } = storeToRefs(storeFilter);

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
    name: 'name',
    required: true,
    label: t('hive'),
    align: 'left',
    field: (row: any) => {
      if (row.deleted) {
        return `${row.name} (${t('deleted')})`;
      } else if (!row.modus) {
        return `${row.name} (${t('inactive')})`;
      }
      return row.name;
    },
    sortable: true
  },
  {
    name: 'apiary_name',
    label: t('apiary'),
    align: 'left',
    field: (row: any) => row.hive_location.apiary_name,
    format: (val: string, row: any) =>
      `${val} (${useDate.displayFormat(row.hive_location.movedate.date)})`,
    sortable: true
  },
  {
    name: 'queen_location.queen_name',
    label: `${t('queenCol')}`,
    align: 'left',
    field: (row: any) => row.queen_location,
    format: (val: string) => queenTableCol(val),
    sortable: true
  },
  {
    name: 'hive_source.name',
    label: t('status'),
    align: 'left',
    field: (row: any) => (row.hive_source ? row.hive_source.name : ''),
    sortable: true
  },
  {
    name: 'hive_type.name',
    label: t('type'),
    align: 'left',
    field: (row: any) => (row.hive_type ? row.hive_type.name : ''),
    format: (val: string) => val,
    sortable: true
  },
  {
    name: 'position',
    label: t('position'),
    align: 'right',
    field: (row: any) => row.position,
    sortable: true
  },
  {
    name: 'grouphive',
    label: t('grouphive'),
    align: 'right',
    field: (row: any) => row.grouphive,
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
    name: 'modus',
    label: t('active'),
    align: 'center',
    field: (row: any) => row.modus,
    sortable: true
  },
  {
    name: 'modus_date',
    label: t('inactiveDate'),
    align: 'center',
    field: (row: any) => row.modus_date,
    format: (val: string, row: any) =>
      row.modus ? '' : useDate.displayFormat(val),
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
} = useHivesQuery({
  order: computed(() => [pagination.value.sortBy]),
  direction: computed(() => (pagination.value.descending ? ['asc'] : ['desc'])),
  offset: computed(() => pagination.value.page - 1),
  limit: computed(() => pagination.value.rowsPerPage),
  q: computed(() => (filter.value ? filter.value : '')),
  filters: computed(() => (filters?.value ? filters.value : '')),
  deleted,
  modus,
  details: true
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

function queenTableCol(queen: any) {
  if (!queen) {
    return '';
  }
  if (queen.queen_modus) {
    return `${queen.queen_name} (${useDate.displayFormat(
      queen.queen_move_date
    )})`;
  }
  return `R.I.P  (${useDate.displayFormat(queen.queen_modus_date)})`;
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
        <template #body-cell-name="props">
          <TableColLink :id="props.row.id" :label="props.value" link="hive" />
        </template>

        <template #body-cell-apiary_name="props">
          <TableColLink
            v-if="props.row.hive_location"
            :id="props.row.hive_location.apiary_id"
            :label="props.value"
            link="apiary"
          />
          <td v-else />
        </template>

        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #body-cell-queen_location.queen_name="props">
          <TableColQueen
            :id="props.value ? props.row.queen_location.queen_id : 0"
            :label="props.value"
            @change="refetch"
          />
        </template>

        <template #body-cell-note="props">
          <TableColNote
            :value="props.value"
            :trunc="visibleColumns.length > 4"
          />
        </template>

        <template #body-cell-modus="props">
          <TableColStatus
            :id="props.row.id"
            :value="props.value"
            table="hive"
            @change="refetch"
          />
        </template>

        <template #top-left>
          <TableButtons
            v-model:deleted="deleted"
            v-model:modus="modus"
            :selected="selected"
            table="hive"
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
