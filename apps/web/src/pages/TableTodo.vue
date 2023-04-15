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
          <table-buttons
            v-model:deleted="deleted"
            v-model:modus="modus"
            label-modus-true="done"
            label-modus-false="open"
            :selected="selected"
            table="todo"
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
        <template #body-cell-url="props">
          <table-col-url :value="props.value"></table-col-url>
        </template>
        <template #body-cell-note="props">
          <table-col-note
            :value="props.value"
            :trunc="visibleColumns.length > 4"
          ></table-col-note>
        </template>

        <template #body-cell-done="props">
          <table-col-status
            :id="props.row.id"
            :value="props.value"
            table="todo"
            @change="refetch"
          ></table-col-status>
        </template>
      </q-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { tableCheckSelected, tableMeta } from '~/helpers';
import { useTodosQuery } from '~/composables/useQuery';
import { useTablesStore } from '~/stores/tables';
import { QTableProps } from 'quasar';
import { useDateFormat } from '~/composables/useDate';
import { useTableFilterStore } from '~/stores/tableFilter';
import { useKeyTable } from '~/composables/useKey';
import TableColNote from '~/components/TableColNote.vue';
import TableColStatus from '~/components/TableColStatus.vue';
import TableColUrl from '~/components/TableColUrl.vue';
import { useI18n } from 'vue-i18n';
import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import TableButtons from '~/components/TableButtons.vue';
import TableFilter from '~/components/TableFilter.vue';

const useDate = useDateFormat();
const { t } = useI18n();

const storeTable = useTablesStore();
const storeFilter = useTableFilterStore();
const { todo: store } = storeToRefs(storeTable);
const { todo: filters } = storeToRefs(storeFilter);

const visibleColumns = ref(store.value.visible);

const selected = ref([]);
const rows = ref([]);
const modus = ref(false);
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
    name: 'name',
    label: t('name'),
    align: 'left',
    field: (row: any) => row.name,
    sortable: true,
  },
  {
    name: 'url',
    label: t('url'),
    align: 'left',
    field: (row: any) => row.url,
    sortable: true,
  },
  {
    name: 'note',
    label: t('note'),
    align: 'left',
    field: (row: any) => row.note,
    sortable: true,
  },
  {
    name: 'done',
    label: t('status'),
    align: 'center',
    field: (row: any) => row.done,
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
} = useTodosQuery({
  order: computed(() => [pagination.value.sortBy]),
  direction: computed(() => (pagination.value.descending ? ['asc'] : ['desc'])),
  offset: computed(() => pagination.value.page - 1),
  limit: computed(() => pagination.value.rowsPerPage),
  q: computed(() => (filter.value ? filter.value : '')),
  filters: computed(() => (filters.value ? filters.value : '')),
  done: modus,
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
