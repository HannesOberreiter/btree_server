<script setup lang="ts">
import type { QTableProps } from 'quasar';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import TableButtons from '../components/TableButtons.vue';
import TableColHivecount from '../components/TableColHivecount.vue';
import TableColLink from '../components/TableColLink.vue';
import TableColNote from '../components/TableColNote.vue';
import TableColStatus from '../components/TableColStatus.vue';
import TableColUrl from '../components/TableColUrl.vue';
import TableFilter from '../components/TableFilter.vue';
import { useDateFormat } from '../composables/useDate';
import { useKeyTable } from '../composables/useKey';
import { useApiariesQuery } from '../composables/useQuery';
import { tableCheckSelected, tableMeta } from '../helpers';
import { useTablesStore } from '../stores/tables';

const useDate = useDateFormat();
const storeTable = useTablesStore();
const { t } = useI18n();
const { apiary: store } = storeToRefs(storeTable);

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
    label: t('apiary'),
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
    name: 'hive_count.count',
    required: false,
    label: t('hive', 2),
    align: 'left',
    field: (row: any) => row.hive_count,
    sortable: true
  },
  {
    name: 'description',
    required: false,
    label: t('description'),
    align: 'left',
    field: (row: any) => row.description,
    sortable: false
  },
  {
    name: 'latitude',
    required: false,
    label: t('latitude'),
    align: 'center',
    field: (row: any) => row.latitude,
    sortable: false
  },
  {
    name: 'longitude',
    required: false,
    label: t('longitude'),
    align: 'center',
    field: (row: any) => row.longitude,
    sortable: false
  },
  {
    name: 'elevation',
    required: false,
    label: t('elevation'),
    align: 'center',
    field: (row: any) => row.elevation,
    sortable: false
  },
  {
    name: 'url',
    required: false,
    label: t('url'),
    align: 'left',
    field: (row: any) => row.url,
    sortable: false
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
} = useApiariesQuery({
  order: computed(() => [pagination.value.sortBy]),
  direction: computed(() => (pagination.value.descending ? ['asc'] : ['desc'])),
  offset: computed(() => pagination.value.page - 1),
  limit: computed(() => pagination.value.rowsPerPage),
  q: computed(() => (filter.value ? filter.value : '')),
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
          <TableColLink :id="props.row.id" :label="props.value" link="apiary" />
        </template>

        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #body-cell-hive_count.count="props">
          <TableColHivecount :hivecount="props.value" />
        </template>

        <template #body-cell-note="props">
          <TableColNote
            :value="props.value"
            :trunc="visibleColumns.length > 4"
          />
        </template>

        <template #body-cell-url="props">
          <TableColUrl :value="props.value" />
        </template>

        <template #body-cell-modus="props">
          <TableColStatus
            :id="props.row.id"
            :value="props.value"
            table="apiary"
            @change="refetch"
          />
        </template>

        <template #top-left>
          <TableButtons
            v-model:deleted="deleted"
            v-model:modus="modus"
            :selected="selected"
            table="apiary"
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
