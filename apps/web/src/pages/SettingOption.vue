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
        separator="vertical"
        row-key="id"
        selection="multiple"
        binary-state-sort
        :rows-per-page-options="[20, 50, 100, 500, 10000]"
        @request="onRequest"
      >
        <template #top-left>
          <table-buttons
            v-model:deleted="deleted"
            v-model:modus="modus"
            :selected="selected"
            table="option"
            :table-option="optionValue"
            @change="refetch"
          ></table-buttons>
        </template>
        <template #top-right>
          <q-select
            v-model="optionSelected"
            outlined
            dense
            bg-color="warning"
            options-dense
            :options="options"
            style="min-width: 150px"
          />
          <table-filter
            v-model:modelFilter="filter"
            v-model:modelVisible="visibleColumns"
            :columns="columns"
            table="option"
          ></table-filter>
        </template>

        <template #body-cell-modus="props">
          <table-col-status
            :id="props.row.id"
            :value="props.value"
            table="option"
            :table-option="optionValue"
            @change="refetch"
          ></table-col-status>
        </template>
        <template #body-cell-favorite="props">
          <table-col-status
            :id="props.row.id"
            :value="props.value"
            table="option"
            :table-option="optionValue"
            type="favorite"
            @change="refetch"
          ></table-col-status>
        </template>
        <template #body-cell-note="props">
          <table-col-note
            :value="props.value"
            :trunc="visibleColumns.length > 4"
          ></table-col-note>
        </template>
      </q-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { tableCheckSelected, tableMeta } from '~/helpers';
import { useOptionsQuery } from '~/composables/useQuery';
import { QTableProps } from 'quasar';
import { Option } from '~/types';
import { PropType } from 'vue';
import { find } from 'lodash-es';

const { t } = useI18n();
const router = useRouter();
const selected = ref([]);
const rows = ref([]);
const filter = ref('');
const visibleColumns = ref(['name', 'favorite', 'modus']);
const modus = ref(true);
const deleted = ref(false);

const pagination = ref({
  sortBy: 'favorite',
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
});

const options = [
  {
    label: t('charge') + ' ' + t('type'),
    value: 'charge_types',
  },
  {
    label: t('checkup') + ' ' + t('type'),
    value: 'checkup_types',
  },
  {
    label: t('hive') + ' ' + t('type'),
    value: 'hive_types',
  },
  {
    label: t('hive') + ' ' + t('status'),
    value: 'hive_sources',
  },
  {
    label: t('queen') + ' ' + t('mating'),
    value: 'queen_matings',
  },
  {
    label: t('queen') + ' ' + t('race'),
    value: 'queen_races',
  },
  {
    label: t('treatment') + ' ' + t('type'),
    value: 'treatment_types',
  },
  {
    label: t('treatment') + ' ' + t('disease'),
    value: 'treatment_diseases',
  },
  {
    label: t('treatment') + ' ' + t('vet'),
    value: 'treatment_vets',
  },
];

const urlProps = defineProps({
  option: {
    type: String as PropType<Option>,
    default: 'checkup_types',
  },
});
const optionSelected = ref(find(options, { value: urlProps.option }));
const optionValue = computed(() => optionSelected.value.value as Option);
watch(optionSelected, (cur) => {
  selected.value = [];
  router.replace({
    name: 'setting-option',
    params: { option: cur.value },
  });
});

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
    name: 'unit',
    label: t('unit'),
    align: 'left',
    field: (row: any) => row.unit,
    sortable: true,
  },
  {
    name: 'favorite',
    label: t('favourite'),
    align: 'center',
    field: (row: any) => row.favorite,
    sortable: true,
  },
  {
    name: 'modus',
    label: t('modus'),
    align: 'center',
    field: (row: any) => row.modus,
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
    format: (val: string) => tableMeta(val, null),
  },
  {
    name: 'updated_at',
    label: t('updated'),
    align: 'center',
    field: (row: any) => row.updated_at,
    format: (val: string) => tableMeta(val, null),
  },
] as QTableProps['columns'];

const {
  isLoading: isLoadingTable,
  data,
  refetch,
} = useOptionsQuery(optionValue, {
  order: computed(() => [pagination.value.sortBy]),
  direction: computed(() => (pagination.value.descending ? ['asc'] : ['desc'])),
  modus: null,
});

watch(
  data,
  () => {
    if (data.value) {
      rows.value = data.value.results;
      selected.value = tableCheckSelected(selected.value, rows.value);
    }
  },
  {
    immediate: true,
  }
);

function onRequest(props: any) {
  pagination.value = props.pagination;
}
</script>
