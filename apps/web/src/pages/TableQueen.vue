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
        <template #body-cell-name="props">
          <table-col-link :id="props.row.id" :label="props.value" link="hive">
          </table-col-link>
        </template>

        <template #body-cell-apiary_name="props">
          <table-col-link
            :id="props.row.hive_location.apiary_id"
            :label="props.value"
            link="apiary"
          >
          </table-col-link>
        </template>

        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #body-cell-queen_location.queen_name="props">
          <table-col-queen
            :id="props.value ? props.row.queen_location.queen_id : 0"
            :label="props.value"
            @change="refetch"
          >
          </table-col-queen>
        </template>

        <template #body-cell-note="props">
          <table-col-note
            :value="props.value"
            :trunc="visibleColumns.length > 4"
          ></table-col-note>
        </template>

        <template #body-cell-modus="props">
          <table-col-status
            :id="props.row.id"
            :value="props.value"
            table="queen"
            @change="refetch"
          ></table-col-status>
        </template>

        <template #top-left>
          <table-buttons
            v-model:deleted="deleted"
            v-model:modus="modus"
            :selected="selected"
            table="queen"
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

<script lang="ts">
import { tableCheckSelected, tableMeta } from '~/helpers';
</script>

<script setup lang="ts">
import { useQueensQuery } from '~/composables/useQuery';
import { useTablesStore } from '~/stores/tables';
import TableColLink from '~/components/TableColLink.vue';
import TableColNote from '~/components/TableColNote.vue';
import TableColStatus from '~/components/TableColStatus.vue';
import TableButtons from '~/components/TableButtons.vue';
import TableColQueen from '~/components/TableColQueen.vue';
import { QTableProps } from 'quasar';
import { useDateFormat } from '~/composables/useDate';
import TableFilter from '~/components/TableFilter.vue';
import { useTableFilterStore } from '~/stores/tableFilter';
import { lowerCase } from 'lodash-es';

const useDate = useDateFormat();
const { t } = useI18n();
const storeTable = useTablesStore();
const storeFilter = useTableFilterStore();
const { queen: store } = storeToRefs(storeTable);
const { queen: filters } = storeToRefs(storeFilter);

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
    name: 'name',
    label: t('name'),
    align: 'left',
    field: (row: any) => row.name,
    sortable: true,
  },
  {
    name: 'date',
    label: t('birth'),
    align: 'left',
    field: (row: any) => row.date,
    format: (val: string) => useDate.displayFormat(val),
    sortable: true,
    classes: (row: any) => `text-${lowerCase(row.mark_colour)}`,
  },
  {
    name: 'mark_colour',
    label: t('markColor'),
    align: 'left',
    field: (row: any) => row.mark_colour,
    sortable: true,
    classes: (row: any) => `text-${lowerCase(row.mark_colour)}`,
  },
  {
    name: 'hive_location.hive_name',
    label: t('hive'),
    align: 'left',
    field: (row: any) =>
      row.hive_location
        ? `${row.hive_location.hive_name} (${useDate.displayFormat(
            row.move_date
          )})`
        : '',
    sortable: true,
  },
  {
    name: 'hive_location.apiary_name',
    label: t('apiary'),
    align: 'left',
    field: (row: any) =>
      row.hive_location ? row.hive_location.apiary_name : '',
    sortable: true,
  },
  {
    name: 'queen_location.hive_name',
    label: t('latest'),
    align: 'left',
    field: (row: any) =>
      !row.queen_location
        ? ''
        : row.modus === false
        ? `${t('yes')} (RIP ${useDate.displayFormat(row.modus_date)})`
        : t('yes'),
    sortable: true,
  },
  {
    name: 'mating.name',
    label: t('mating'),
    align: 'left',
    field: (row: any) => (row.mating ? row.mating.name : ''),
    sortable: true,
  },
  {
    name: 'race.name',
    label: t('race'),
    align: 'left',
    field: (row: any) => (row.race ? row.race.name : ''),
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
    name: 'modus',
    label: t('active'),
    align: 'center',
    field: (row: any) => row.modus,
    sortable: true,
  },
  {
    name: 'modus_date',
    label: t('inactiveDate'),
    align: 'center',
    field: (row: any) => row.modus_date,
    format: (val: string, row: any) =>
      row.modus ? '' : useDate.displayFormat(val),
    sortable: true,
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
  {
    name: 'deleted_at',
    label: t('deleted'),
    align: 'center',
    field: (row: any) => row.deleted_at,
    format: (val: string, row: any) =>
      row.deleted ? tableMeta(val, row.editor) : '',
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

const {
  isLoading: isLoadingTable,
  data,
  refetch,
} = useQueensQuery({
  order: computed(() => [pagination.value.sortBy]),
  direction: computed(() => (pagination.value.descending ? ['asc'] : ['desc'])),
  offset: computed(() => pagination.value.page - 1),
  limit: computed(() => pagination.value.rowsPerPage),
  q: computed(() => (filter.value ? filter.value : '')),
  filters: computed(() => (filters.value ? filters.value : '')),
  deleted: deleted,
  modus: null,
  details: true,
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
