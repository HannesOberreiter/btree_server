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
        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #body-cell-hive.name="props">
          <table-col-link
            :id="props.row.hive.id"
            :label="props.value"
            link="hive"
          >
          </table-col-link>
        </template>
        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #body-cell-apiary.name="props">
          <table-col-link
            :id="props.row.apiary.id"
            :label="props.value"
            link="apiary"
          >
          </table-col-link>
        </template>
        <template #top-left>
          <table-buttons
            v-model:deleted="deleted"
            v-model:modus="modus"
            :selected="selected"
            table="movedate"
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
import { useMovementsQuery } from '~/composables/useQuery';
import { useTablesStore } from '~/stores/tables';
import { QTableProps } from 'quasar';
import { useDateFormat } from '~/composables/useDate';
import { useTableFilterStore } from '~/stores/tableFilter';
import { useKeyTable } from '~/composables/useKey';
import TableColLink from '~/components/TableColLink.vue';
import { useI18n } from 'vue-i18n';
import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import TableButtons from '~/components/TableButtons.vue';
import TableFilter from '~/components/TableFilter.vue';

const useDate = useDateFormat();
const { t } = useI18n();

const storeTable = useTablesStore();
const storeFilter = useTableFilterStore();
const { movedate: store } = storeToRefs(storeTable);
const { movedate: filters } = storeToRefs(storeFilter);

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
    name: 'date',
    required: true,
    label: t('date'),
    align: 'left',
    field: (row: any) => row.date,
    format: (val: string) => useDate.displayFormat(val),
    sortable: true,
  },
  {
    name: 'hive.name',
    required: false,
    label: t('hive'),
    align: 'left',
    field: (row: any) => {
      if (row.hive.deleted) {
        return `${row.hive.name} (${t('deleted')})`;
      } else if (!row.hive.modus) {
        return `${row.hive.name} (${t('inactive')})`;
      }
      return row.hive.name;
    },
    sortable: true,
  },
  {
    name: 'apiary.name',
    required: false,
    label: t('newApiary'),
    align: 'left',
    field: (row: any) => {
      if (!row.apiary.modus) {
        return `${row.apiary.name} (${t('inactive')})`;
      } else if (row.apiary.deleted) {
        return `${row.apiary.name} (${t('deleted')})`;
      }
      return row.apiary.name;
    },
    sortable: true,
  },
  {
    name: 'movedate_previous_apiary.previous_apiary_name',
    required: false,
    label: t('previousApiary'),
    align: 'left',
    field: (row: any) =>
      row.movedate_previous_apiary?.previous_apiary_name ?? '',
    sortable: false,
  },
  {
    name: 'created_at',
    label: t('created'),
    align: 'center',
    field: (row: any) => row.created_at,
    format: (val: string, row: any) =>
      tableMeta(val, row.creator, useDate.formats.value['date-time']),
    sortable: true,
  },
  {
    name: 'updated_at',
    label: t('updated'),
    align: 'center',
    field: (row: any) => row.updated_at,
    format: (val: string, row: any) =>
      tableMeta(val, row.editor, useDate.formats.value['date-time']),
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
} = useMovementsQuery({
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
  },
);

function onRequest(props: any) {
  store.value.length = props.pagination.rowsPerPage;
  store.value.sort = props.pagination.sortBy;
  store.value.direction = props.pagination.descending;
  pagination.value = props.pagination;
}
</script>
