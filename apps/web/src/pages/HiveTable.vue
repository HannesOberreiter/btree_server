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
          <q-btn
            class="q-mr-sm"
            color="primary"
            unelevated
            :label="$t('new')"
            @click="onNew"
          />
          <q-btn
            class="q-mr-sm"
            color="secondary"
            unelevated
            :disable="selected.length > 0 ? false : true"
            :label="$t('edit')"
            @click="onEdit"
          />

          <q-btn
            class="q-mr-sm"
            color="warning"
            unelevated
            :label="modus ? $t('showInactive') : $t('showActive')"
            @click="modus = !modus"
          />

          <q-btn-dropdown unelevated color="info" :label="$t('more')">
            <q-list>
              <q-item
                v-close-popup
                clickable
                :disable="selected.length > 0 ? false : true"
                @click="onDelete"
              >
                <q-item-section>
                  <q-item-label>{{ $t('delete') }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
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
</script>

<script setup lang="ts">
import { useHivesQuery } from '~/composables/useQuery';
import { useTablesStore } from '~/stores/tables';
import TableColLink from '~/components/TableColLink.vue';
import TableColNote from '~/components/TableColNote.vue';
import DialogForm from '~/components/DialogForm.vue';

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
const modus = ref(true);
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
  {
    name: 'modus',
    label: t('Active'),
    align: 'center',
    field: (row: any) => row.modus,
    sortable: true,
  },
  {
    name: 'created_at',
    label: t('Created'),
    align: 'center',
    field: (row: any) => row.created_at,
    format: (val: string, row: any) => rowTableMeta(val, row.creator),
    sortable: true,
  },
  {
    name: 'updated_at',
    label: t('Updated'),
    align: 'center',
    field: (row: any) => row.updated_at,
    format: (val: string, row: any) => rowTableMeta(val, row.editor),
    sortable: true,
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
  modus: modus,
});

function onRequest(props: any) {
  filter.value = props.filter;
  lengthTable.value = props.pagination.rowsPerPage;
  sortBy.value = props.pagination.sortBy;
  descending.value = props.pagination.descending;
  pagination.value = props.pagination;
}

const rows = ref([]);

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
  console.log(rowIds);
  console.log(selected);
  return selected.filter((o: any) => rowIds.includes(o.id));
}

function onNew() {
  $q.dialog({
    component: DialogForm,
    componentProps: {
      title: 'new',
      form: 'hive',
      maximized: true,
      ids: null,
    },
  }).onDismiss(() => {
    refetch.value().then();
  });
}

function onEdit() {
  const ids = selected.value.map((o) => o.id);
  $q.dialog({
    component: DialogForm,
    componentProps: {
      title: 'edit',
      form: 'hive',
      maximized: true,
      ids: ids,
    },
  }).onDismiss(() => {
    refetch.value().then();
  });
}

function onDelete() {
  console.log('remove');
}
</script>
