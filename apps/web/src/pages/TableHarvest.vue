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
            label-modus-true="done"
            label-modus-false="open"
            :selected="selected"
            table="harvest"
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

        <template #header-cell-amount="props">
          <table-th-sum
            :parent-prop="props"
            :label="props.col.label"
            :name="props.col.name"
            :selected="selected"
          ></table-th-sum>
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
            table="harvest"
            @change="refetch"
          ></table-col-status>
        </template>
        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #body-cell-hive.name="props">
          <table-col-link
            :id="props.row.hive_id"
            :label="props.value"
            link="hive"
          >
          </table-col-link>
        </template>
        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #body-cell-harvest_apiary.apiary_name="props">
          <table-col-link
            v-if="props.row.harvest_apiary"
            :id="props.row.harvest_apiary.apiary_id"
            :label="props.value"
            link="apiary"
          >
          </table-col-link>
          <td v-else></td>
        </template>
      </q-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { tableCheckSelected, tableMeta } from '~/helpers';
import { useTasksQuery } from '~/composables/useQuery';
import { useTablesStore } from '~/stores/tables';
import { QTableProps } from 'quasar';
import { useDateFormat } from '~/composables/useDate';
import { useTableFilterStore } from '~/stores/tableFilter';
import { useKeyTable } from '~/composables/useKey';
import TableColLink from '~/components/TableColLink.vue';
import TableColNote from '~/components/TableColNote.vue';
import TableColStatus from '~/components/TableColStatus.vue';
import TableColUrl from '~/components/TableColUrl.vue';
import { useI18n } from 'vue-i18n';
import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import TableButtons from '~/components/TableButtons.vue';
import TableFilter from '~/components/TableFilter.vue';
import TableThSum from '~/components/TableThSum.vue';

const useDate = useDateFormat();
const { t } = useI18n();

const storeTable = useTablesStore();
const storeFilter = useTableFilterStore();
const { harvest: store } = storeToRefs(storeTable);
const { harvest: filters } = storeToRefs(storeFilter);

const visibleColumns = ref(store.value.visible);

const selected = ref([]);
const rows = ref([]);
const modus = ref(null);
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
    label: t('date'),
    align: 'left',
    field: (row: any) => row.date,
    format: (val: string) => useDate.displayFormat(val),
    sortable: true,
  },
  {
    name: 'enddate',
    label: t('dateEnd'),
    align: 'left',
    field: (row: any) => row.enddate,
    format: (val: string, row: any) =>
      row.date === row.enddate ? '-' : useDate.displayFormat(val),
    sortable: true,
  },
  {
    name: 'amount',
    label: t('amount'),
    align: 'right',
    field: (row: any) => row.amount,
    format: (val: string) => val,
    sortable: true,
  },
  {
    name: 'frames',
    label: t('frame', 2),
    align: 'right',
    field: (row: any) => row.frames,
    format: (val: string) => val,
    sortable: true,
  },
  {
    name: 'type.name',
    label: t('type'),
    align: 'left',
    field: (row: any) => (row.type ? row.type.name : ''),
    format: (val: string) => val,
    sortable: true,
  },
  {
    name: 'hive.name',
    label: t('hive'),
    align: 'left',
    field: (row: any) =>
      row.hive.modus ? row.hive.name : `${row.hive.name} (${t('inactive')})`,
    sortable: true,
  },
  {
    name: 'harvest_apiary.apiary_name',
    label: t('apiary'),
    align: 'left',
    field: (row: any) =>
      row.harvest_apiary ? row.harvest_apiary.apiary_name : '',
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
    name: 'water',
    label: t('water'),
    align: 'right',
    field: (row: any) => row.water,
    format: (val: string) => val + '%',
    sortable: true,
  },
  {
    name: 'charge',
    label: t('charge'),
    align: 'center',
    field: (row: any) => row.charge,
    format: (val: string) => val,
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
useKeyTable(pagination);

const {
  isLoading: isLoadingTable,
  data,
  refetch,
} = useTasksQuery('harvest', {
  order: computed(() => [pagination.value.sortBy]),
  direction: computed(() => (pagination.value.descending ? ['asc'] : ['desc'])),
  offset: computed(() => pagination.value.page - 1),
  limit: computed(() => pagination.value.rowsPerPage),
  q: computed(() => (filter.value ? filter.value : '')),
  filters: computed(() => (filters.value ? filters.value : '')),
  deleted: deleted,
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
