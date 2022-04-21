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
        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #body-cell-scale.hive.name="props">
          <table-col-link
            v-if="props.row.scale.hive"
            :id="props.row.scale.hive.name"
            :label="props.value"
            link="hive"
          >
          </table-col-link>
          <td v-else></td>
        </template>

        <template #body-cell-note="props">
          <table-col-note
            :value="props.value"
            :trunc="visibleColumns.length > 4"
          ></table-col-note>
        </template>

        <template #top-left>
          <table-buttons
            v-model:deleted="deleted"
            v-model:modus="modus"
            :selected="selected"
            table="scale_data"
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
import { tableCheckSelected } from '~/helpers';
</script>

<script setup lang="ts">
import { useScaleDataQuery } from '~/composables/useQuery';
import { useTablesStore } from '~/stores/tables';
import TableColLink from '~/components/TableColLink.vue';
import TableColNote from '~/components/TableColNote.vue';
import TableButtons from '~/components/TableButtons.vue';
import { QTableProps } from 'quasar';
import { useDateFormat } from '~/composables/useDate';
import TableFilter from '~/components/TableFilter.vue';
import { useTableFilterStore } from '~/stores/tableFilter';

const useDate = useDateFormat();
const { t } = useI18n();
const storeTable = useTablesStore();
const storeFilter = useTableFilterStore();
const { scale_data: store } = storeToRefs(storeTable);
const { scale_data: filters } = storeToRefs(storeFilter);

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
    name: 'scale.name',
    required: true,
    label: t('scale.name'),
    align: 'left',
    field: (row: any) => row.scale.name,
    sortable: true,
  },
  {
    name: 'scale.hive.name',
    label: t('hive'),
    align: 'left',
    field: (row: any) => (row.scale.hive ? row.scale.hive.name : ''),
    sortable: true,
  },
  {
    name: 'datetime',
    label: t('timestamp'),
    align: 'left',
    field: (row: any) => row.datetime,
    format: (val: string, row: any) =>
      useDate.isoFormat(val, 'date-time-seconds'),
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
    name: 'temp1',
    label: t('temp') + ' 1',
    align: 'right',
    field: (row: any) => row.temp1,
    sortable: true,
  },
  {
    name: 'temp2',
    label: t('temp') + ' 2',
    align: 'right',
    field: (row: any) => row.temp2,
    sortable: true,
  },
  {
    name: 'humidity',
    label: t('humidity'),
    align: 'right',
    field: (row: any) => row.humidity,
    sortable: true,
  },
  {
    name: 'rain',
    label: t('rain'),
    align: 'right',
    field: (row: any) => row.rain,
    sortable: true,
  },
  {
    name: 'note',
    label: t('note'),
    align: 'left',
    field: (row: any) => row.note,
    sortable: false,
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
} = useScaleDataQuery({
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
  }
);

function onRequest(props: any) {
  store.value.length = props.pagination.rowsPerPage;
  store.value.sort = props.pagination.sortBy;
  store.value.direction = props.pagination.descending;
  pagination.value = props.pagination;
}
</script>
