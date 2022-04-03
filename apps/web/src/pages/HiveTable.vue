<template>
  <div class="row q-pa-sm justify-center">
    <div class="col-12">
      {{ $t('hive', 2) }}
      <q-table
        v-model:pagination="pagination"
        v-model:selected="selected"
        :rows="rows"
        :columns="columns"
        :visible-columns="visibleColumns"
        separator="vertical"
        row-key="id"
        selection="multiple"
        :loading="isLoadingTable"
        binary-state-sort
        :dense="$q.screen.lt.md"
        :rows-per-page-options="[10, 50, 100, 500, 10000]"
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

        <template #body-cell-note="props">
          <table-col-note
            :value="props.value"
            :trunc="visibleColumns.length > 4"
          ></table-col-note>
        </template>

        <template #top-left>
          <q-btn color="primary" :label="$t('new')" @click="addRow" />
          <q-btn
            class="q-ml-sm"
            color="primary"
            :label="$t('remove')"
            @click="removeRow"
          />
        </template>
        <template #top-right>
          <q-input
            v-model="filter"
            borderless
            dense
            debounce="300"
            placeholder="Search"
          >
            <template #append>
              <q-icon name="fas fa-magnifier" />
            </template>
          </q-input>
          <q-select
            v-model="visibleColumns"
            multiple
            outlined
            dense
            options-dense
            emit-value
            :options="optionColumns"
            option-label="label"
            option-value="name"
            :display-value="$q.lang.table.columns"
            options-cover
            style="min-width: 150px"
          />
        </template>
      </q-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { useHivesQuery } from '~/composables/useQuery';
import { useTablesStore } from '~/stores/tables';
import TableColLink from '~/components/TableColLink.vue';
import TableColNote from '~/components/TableColNote.vue';

const storeTable = useTablesStore();
const {
  visibleHive: visibleColumns,
  lengthHive: lengthTable,
  sortHive: sortBy,
  directionHive: descending,
} = storeToRefs(storeTable);

const { t } = useI18n();
const selected = ref([]);

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
    required: true,
    label: t('hive'),
    align: 'left',
    field: (row: any) => row.name,
    sortable: true,
  },
  {
    name: 'apiary_name',
    label: t('apiary'),
    align: 'left',
    field: (row: any) => row.hive_location.apiary_name,
    format: (val: string, row: any) =>
      `${val} (${dayjs(row.hive_location.movedate.date).format('YYYY-MM-DD')})`,
    sortable: true,
  },
  {
    name: 'hive_source.name',
    label: t('source'),
    align: 'left',
    field: (row: any) => row.hive_source.name,
    sortable: true,
  },
  {
    name: 'hive_type.name',
    label: t('type'),
    align: 'left',
    field: (row: any) => row.hive_type.name,
    format: (val: string) => val,
    sortable: true,
  },
  {
    name: 'position',
    label: t('position'),
    align: 'right',
    field: (row: any) => row.position,
    sortable: true,
  },
  {
    name: 'grouphive',
    label: t('grouphive'),
    align: 'right',
    field: (row: any) => row.grouphive,
    sortable: true,
  },
  {
    name: 'note',
    label: t('note'),
    align: 'left',
    field: (row: any) => row.note,
    sortable: false,
  },
];

const optionColumns = columns.filter((obj) => (!obj.required ? obj : null));

const pagination = ref({
  sortBy: sortBy.value,
  descending: descending.value,
  page: 1,
  rowsPerPage: lengthTable.value,
  rowsNumber: 0,
});
const filter = ref('');

const { isLoading: isLoadingTable, data: hives } = useHivesQuery({
  order: computed(() => [pagination.value.sortBy]),
  direction: computed(() => (pagination.value.descending ? ['asc'] : ['desc'])),
  offset: computed(() => pagination.value.page - 1),
  limit: computed(() => pagination.value.rowsPerPage),
  q: computed(() => (filter.value ? filter.value : '')),
});

function onRequest(props: any) {
  filter.value = props.filter;
  lengthTable.value = props.pagination.rowsPerPage;
  sortBy.value = props.pagination.sortBy;
  descending.value = props.pagination.descending;
  pagination.value = props.pagination;
}

const rows = ref([]);

if (hives.value) {
  // Data already in cache
  rows.value = hives.value.results;
  pagination.value.rowsNumber = hives.value.total;
}
watch(hives, () => {
  rows.value = hives.value.results;
  pagination.value.rowsNumber = hives.value.total;
});

function addRow() {
  console.log('add');
}

function removeRow() {
  console.log('remove');
}
</script>
