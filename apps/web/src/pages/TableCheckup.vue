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
            :selected="selected"
            table="checkup"
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

        <template #header-cell="props">
          <q-th :props="props">
            <table-header-icon
              v-if="props.col.headerClasses === 'rating'"
              icon="fas fa-star"
              :label="props.col.label"
            >
            </table-header-icon>
            <table-header-icon
              v-else-if="props.col.headerClasses === 'queen'"
              icon="fas fa-venus"
              :label="props.col.label"
            >
            </table-header-icon>
            <table-header-icon
              v-else-if="props.col.headerClasses === 'frames'"
              icon="fas fa-window-maximize"
              :label="props.col.label"
            >
            </table-header-icon>
            <span v-else>{{ props.col.label }}</span>
          </q-th>
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

        <template #body-cell-queen="props">
          <table-col-boolean :value="props.value"></table-col-boolean>
        </template>
        <template #body-cell-capped_brood="props">
          <table-col-boolean :value="props.value"></table-col-boolean>
        </template>
        <template #body-cell-eggs="props">
          <table-col-boolean :value="props.value"></table-col-boolean>
        </template>
        <template #body-cell-queencells="props">
          <table-col-boolean :value="props.value"></table-col-boolean>
        </template>

        <template #body-cell-done="props">
          <table-col-status
            :id="props.row.id"
            :value="props.value"
            table="checkup"
            @change="refetch"
          ></table-col-status>
        </template>
      </q-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { tableCheckSelected, tableMeta } from '~/helpers';
import { useTasksQuery } from '~/composables/useQuery';
import { useTablesStore } from '~/stores/tables';
import TableButtons from '~/components/TableButtons.vue';
import { QTableProps } from 'quasar';
import TableFilter from '~/components/TableFilter.vue';
import { useDateFormat } from '~/composables/useDate';
import { useTableFilterStore } from '~/stores/tableFilter';
import TableColNote from '~/components/TableColNote.vue';
import TableColStatus from '~/components/TableColStatus.vue';
import TableColBoolean from '~/components/TableColBoolean.vue';
import TableColUrl from '~/components/TableColUrl.vue';
import TableHeaderIcon from '~/components/TableHeaderIcon.vue';

const useDate = useDateFormat();
const { t } = useI18n();

const storeTable = useTablesStore();
const storeFilter = useTableFilterStore();
const { checkup: store } = storeToRefs(storeTable);
const { checkup: filters } = storeToRefs(storeFilter);

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
    field: (row: any) => row.hive.name,
    format: (val: string, row: any) =>
      row.hive.modus ? val : `${val} (${t('inactive')})`,
    sortable: true,
  },
  {
    name: 'checkup_apiary.apiary_name',
    label: t('apiary'),
    align: 'left',
    field: (row: any) =>
      row.checkup_apiary ? row.checkup_apiary.apiary_name : '',
    sortable: true,
  },
  /***
      "Seen" booleans
      queen, eggs, capped_brood, queencells
   */
  {
    name: 'queen',
    label: t('queen'),
    align: 'center',
    field: (row: any) => row.queen,
    sortable: true,
    headerClasses: 'queen',
  },
  {
    name: 'eggs',
    label: t('egg', 2),
    align: 'center',
    field: (row: any) => row.eggs,
    sortable: true,
    headerClasses: 'queen',
  },
  {
    name: 'capped_brood',
    label: t('cappedBrood'),
    align: 'center',
    field: (row: any) => row.capped_brood,
    sortable: true,
    headerClasses: 'queen',
  },
  {
    name: 'queencells',
    label: t('queencell', 2),
    align: 'center',
    field: (row: any) => row.queencells,
    sortable: true,
    headerClasses: 'queen',
  },
  /**
    Ratings
    brood, pollen, comb, temper, calm_comb, swarm
   */
  {
    name: 'brood',
    label: t('rating.brood'),
    align: 'right',
    field: (row: any) => row.brood,
    sortable: true,
    headerClasses: 'rating',
  },
  {
    name: 'pollen',
    label: t('rating.pollen'),
    align: 'right',
    field: (row: any) => row.pollen,
    sortable: true,
    headerClasses: 'rating',
  },
  {
    name: 'comb',
    label: t('rating.comb'),
    align: 'right',
    field: (row: any) => row.comb,
    sortable: true,
    headerClasses: 'rating',
  },
  {
    name: 'temper',
    label: t('rating.temper'),
    align: 'right',
    field: (row: any) => row.temper,
    sortable: true,
    headerClasses: 'rating',
  },
  {
    name: 'calm_comb',
    label: t('rating.calm_comb'),
    align: 'right',
    field: (row: any) => row.calm_comb,
    sortable: true,
    headerClasses: 'rating',
  },
  {
    name: 'swarm',
    label: t('rating.swarm'),
    align: 'right',
    field: (row: any) => row.swarm,
    sortable: true,
    headerClasses: 'rating',
  },
  /**
    Frames
    broodframes, honeyframes, foundation, empty
   */
  {
    name: 'broodframes',
    label: t('frames.broodframes'),
    align: 'right',
    field: (row: any) => row.broodframes,
    sortable: true,
    headerClasses: 'frames',
  },

  {
    name: 'honeyframes',
    label: t('frames.honeyframes'),
    align: 'right',
    field: (row: any) => row.honeyframes,
    sortable: true,
    headerClasses: 'frames',
  },
  {
    name: 'foundation',
    label: t('frames.foundation'),
    align: 'right',
    field: (row: any) => row.foundation,
    sortable: true,
    headerClasses: 'frames',
  },
  {
    name: 'emptyframes',
    label: t('frames.emptyframes'),
    align: 'right',
    field: (row: any) => row.emptyframes,
    sortable: true,
    headerClasses: 'frames',
  },
  {
    name: 'varroa',
    label: t('varroa'),
    align: 'right',
    field: (row: any) => row.varroa,
    sortable: true,
  },
  {
    name: 'strong',
    label: t('strong'),
    align: 'right',
    field: (row: any) => row.strong,
    sortable: true,
  },
  {
    name: 'temp',
    label: t('temperature'),
    align: 'right',
    field: (row: any) => row.temp,
    format: (val: string) => val + ' °C',
    sortable: true,
  },
  {
    name: 'weight',
    label: t('weight'),
    align: 'right',
    field: (row: any) => row.weight,
    sortable: true,
  },
  {
    name: 'time',
    label: t('time'),
    align: 'right',
    field: (row: any) => row.time,
    format: (val: string) => useDate.displayFormat(val, 'time', 'HH:mm:ss'),
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

const {
  isLoading: isLoadingTable,
  data,
  refetch,
} = useTasksQuery('checkup', {
  order: computed(() => [pagination.value.sortBy]),
  direction: computed(() => (pagination.value.descending ? ['asc'] : ['desc'])),
  offset: computed(() => pagination.value.page - 1),
  limit: computed(() => pagination.value.rowsPerPage),
  q: computed(() => (filter.value ? filter.value : '')),
  filters: computed(() => (filters.value ? filters.value : '')),
  deleted: deleted,
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
