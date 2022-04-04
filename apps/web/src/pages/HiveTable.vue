<template>
  <div class="row q-pa-sm justify-center">
    <div class="col-12">
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

        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #body-cell-queen_location.queen_name="props">
          <table-col-link
            v-if="props.value"
            :id="props.row.queen_location.queen_id"
            :label="props.value"
            link="queen"
          >
          </table-col-link>
          <q-td v-else>{{ $t('noQueen') }}</q-td>
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
            table="hive"
            @change="refetch"
          ></table-col-status>
        </template>

        <template #top-left>
          <table-buttons
            v-model:deleted="deleted"
            v-model:modus="modus"
            :selected="selected"
            table="hive"
            @change="refetch"
          ></table-buttons>
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

<script lang="ts">
import dayjs from 'dayjs';

function rowTableMeta(date: string, name: any) {
  if (dayjs(date).isValid() === false) return '';
  if (name) {
    return `${name.email} (${dayjs(date).format('YYYY-MM-DD HH:mm')})`;
  } else {
    return dayjs(date).format('YYYY-MM-DD HH:mm');
  }
}

function queenTableCol(queen: any) {
  if (!queen) return '';
  if (queen.queen_modus)
    return `${queen.queen_name} (${dayjs(queen.queen_move_date).format(
      'YYYY-MM-DD'
    )})`;
  return `R.I.P  (${dayjs(queen.queen_modus_date).format('YYYY-MM-DD')})`;
}
</script>

<script setup lang="ts">
import { useHivesQuery } from '~/composables/useQuery';
import { useTablesStore } from '~/stores/tables';
import TableColLink from '~/components/TableColLink.vue';
import TableColNote from '~/components/TableColNote.vue';
import TableColStatus from '~/components/TableColStatus.vue';
import TableButtons from '~/components/TableButtons.vue';
import { QTableProps } from 'quasar';

const storeTable = useTablesStore();
const $q = useQuasar();
const {
  visibleHive: visibleColumns,
  lengthHive: lengthTable,
  sortHive: sortBy,
  directionHive: descending,
} = storeToRefs(storeTable);

const { t } = useI18n();
const selected = ref([]);
const rows = ref([]);
const modus = ref(true);
const deleted = ref(false);
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
    name: 'queen_location.queen_name',
    label: t('queen'),
    align: 'left',
    field: (row: any) => row.queen_location,
    format: (val: string) => queenTableCol(val),
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
      row.modus ? '' : dayjs(val).format('YYYY-MM-DD'),
    sortable: true,
  },
  {
    name: 'created_at',
    label: t('created'),
    align: 'center',
    field: (row: any) => row.created_at,
    format: (val: string, row: any) => rowTableMeta(val, row.creator),
    sortable: true,
  },
  {
    name: 'updated_at',
    label: t('updated'),
    align: 'center',
    field: (row: any) => row.updated_at,
    format: (val: string, row: any) => rowTableMeta(val, row.editor),
    sortable: true,
  },
  {
    name: 'deleted_at',
    label: t('deleted'),
    align: 'center',
    field: (row: any) => row.deleted_at,
    format: (val: string, row: any) =>
      row.deleted ? rowTableMeta(val, row.editor) : '',
    sortable: true,
  },
] as QTableProps['columns'];

const optionColumns = columns.filter((obj) => (!obj.required ? obj : null));

const pagination = ref({
  sortBy: sortBy.value,
  descending: descending.value,
  page: 1,
  rowsPerPage: lengthTable.value,
  rowsNumber: 0,
});
const filter = ref('');

const {
  isLoading: isLoadingTable,
  data,
  refetch,
} = useHivesQuery({
  order: computed(() => [pagination.value.sortBy]),
  direction: computed(() => (pagination.value.descending ? ['asc'] : ['desc'])),
  offset: computed(() => pagination.value.page - 1),
  limit: computed(() => pagination.value.rowsPerPage),
  q: computed(() => (filter.value ? filter.value : '')),
  deleted: deleted,
  modus: modus,
  details: true,
});

if (data.value) {
  // Data already in cache
  rows.value = data.value.results;
  pagination.value.rowsNumber = data.value.total;
}
watch(data, () => {
  rows.value = data.value.results;
  pagination.value.rowsNumber = data.value.total;
  selected.value = checkSelected(selected.value, rows.value);
});

function checkSelected(selected: any[], rows: any) {
  const rowIds = rows.map((o: any) => o.id);
  return selected.filter((o: any) => rowIds.includes(o.id));
}
function onRequest(props: any) {
  filter.value = props.filter;
  lengthTable.value = props.pagination.rowsPerPage;
  sortBy.value = props.pagination.sortBy;
  descending.value = props.pagination.descending;
  pagination.value = props.pagination;
}
</script>
