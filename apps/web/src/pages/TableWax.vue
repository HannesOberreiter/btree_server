<script setup lang="ts">
import type {
  WaxLotListResponse,
  WaxLotResponse,
  WaxOperationListResponse,
  WaxOperationResponse
} from '../api/types';
import type { QTableProps } from 'quasar';
import { exportFile, useQuasar } from 'quasar';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import WaxOperationDialog from '../components/WaxOperationDialog.vue';
import { useApiFetch } from '../composables/useApi';
import { useDateFormat } from '../composables/useDate';
import { useNotification } from '../composables/useNotification';
import { useAuthUserStore } from '../stores/auth';
import { useTablesStore } from '../stores/tables';
import BtnBase from '@/components/BtnBase.vue';

const api = useApiFetch();
const $q = useQuasar();
const { t } = useI18n();
const date = useDateFormat();
const notification = useNotification();
const auth = useAuthUserStore();
const tables = useTablesStore();
const tab = ref<'summary' | 'lots' | 'operations'>('lots');
const dialog = ref(false);
const hiveDialog = ref(false);
const selectedHives = ref<WaxOperationResponse['hives']>([]);
const loading = ref(false);
const filter = ref<string | null>('');
const showEmpty = ref(false);
const lots = ref<WaxLotResponse[]>([]);
const operations = ref<WaxOperationResponse[]>([]);
const rowsPerPageOptions = [10, 50, 100, 500, 10000];
const summaryPagination = ref({
  sortBy: tables.waxSummary.sort,
  descending: tables.waxSummary.direction,
  page: 1,
  rowsPerPage: tables.waxSummary.length
});
const lotsPagination = ref({
  sortBy: tables.waxLots.sort,
  descending: tables.waxLots.direction,
  page: 1,
  rowsPerPage: tables.waxLots.length
});
const operationsPagination = ref({
  sortBy: tables.waxOperations.sort,
  descending: tables.waxOperations.direction,
  page: 1,
  rowsPerPage: tables.waxOperations.length
});

watch(
  summaryPagination,
  value => {
    tables.waxSummary.length = value.rowsPerPage;
    tables.waxSummary.sort = value.sortBy;
    tables.waxSummary.direction = value.descending;
  },
  { deep: true }
);
watch(
  lotsPagination,
  value => {
    tables.waxLots.length = value.rowsPerPage;
    tables.waxLots.sort = value.sortBy;
    tables.waxLots.direction = value.descending;
  },
  { deep: true }
);
watch(
  operationsPagination,
  value => {
    tables.waxOperations.length = value.rowsPerPage;
    tables.waxOperations.sort = value.sortBy;
    tables.waxOperations.direction = value.descending;
  },
  { deep: true }
);

const lotColumns: QTableProps['columns'] = [
  {
    name: 'code',
    label: t('wax.lotCode'),
    field: 'code',
    align: 'left',
    sortable: true
  },
  {
    name: 'product_name',
    label: t('wax.product'),
    field: 'product_name',
    align: 'left',
    sortable: true
  },
  {
    name: 'stock_kg',
    label: t('wax.stockKg'),
    field: 'stock_kg',
    align: 'right',
    format: value => `${Number(value).toFixed(2)} kg`,
    sortable: true
  },
  {
    name: 'reference',
    label: t('wax.reference'),
    field: 'reference',
    align: 'left',
    sortable: true
  },
  { name: 'note', label: t('note'), field: 'note', align: 'left' },
  { name: 'actions', label: '', field: 'id', align: 'center' }
];
const summaryColumns: QTableProps['columns'] = [
  {
    name: 'product_name',
    label: t('wax.product'),
    field: 'product_name',
    align: 'left',
    sortable: true
  },
  {
    name: 'stock_kg',
    label: t('wax.stockKg'),
    field: 'stock_kg',
    align: 'right',
    format: value => `${Number(value).toFixed(2)} kg`,
    sortable: true
  },
  {
    name: 'lot_count',
    label: t('wax.lotCount'),
    field: 'lot_count',
    align: 'right',
    sortable: true
  }
];
const operationColumns: QTableProps['columns'] = [
  {
    name: 'date',
    label: t('date'),
    field: 'date',
    align: 'left',
    format: value => date.displayFormat(value),
    sortable: true
  },
  {
    name: 'type',
    label: t('wax.operationType'),
    field: 'type',
    align: 'left',
    format: (_value, row) => operationTypeLabel(row as WaxOperationResponse),
    sortable: true
  },
  {
    name: 'input_kg',
    label: t('wax.inputs'),
    field: 'input_kg',
    align: 'right',
    format: value => `${Number(value).toFixed(2)} kg`,
    sortable: true
  },
  {
    name: 'output_kg',
    label: t('wax.outputs'),
    field: 'output_kg',
    align: 'right',
    format: value => `${Number(value).toFixed(2)} kg`,
    sortable: true
  },
  {
    name: 'difference_kg',
    label: t('wax.difference'),
    field: 'difference_kg',
    align: 'right',
    format: value => `${Number(value).toFixed(2)} kg`,
    sortable: true
  },
  {
    name: 'origin_type_name',
    label: t('wax.originType'),
    field: 'origin_type_name',
    align: 'left',
    sortable: true
  },
  {
    name: 'counterparty',
    label: t('wax.counterparty'),
    field: 'counterparty',
    align: 'left',
    sortable: true
  },
  {
    name: 'reference',
    label: t('wax.reference'),
    field: 'reference',
    align: 'left',
    sortable: true
  },
  { name: 'note', label: t('note'), field: 'note', align: 'left' },
  { name: 'actions', label: '', field: 'id', align: 'center' }
];
const reversedIds = computed(
  () =>
    new Set(
      operations.value.flatMap(operation =>
        operation.reversal_of_id ? [operation.reversal_of_id] : []
      )
    )
);
const visibleLots = computed(() =>
  showEmpty.value
    ? lots.value
    : lots.value.filter(lot => Math.abs(lot.stock_kg) >= 0.005)
);
const filteredLots = computed(() => {
  const query = (filter.value ?? '').toLowerCase();
  if (!query) {
    return visibleLots.value;
  }
  return visibleLots.value.filter(lot =>
    [lot.code, lot.product_name, lot.reference, lot.note].some(value =>
      value?.toLowerCase().includes(query)
    )
  );
});
const summaryRows = computed(() => {
  const grouped = new Map<
    string,
    { id: string; product_name: string; stock_kg: number; lot_count: number }
  >();
  for (const lot of visibleLots.value) {
    const id = String(lot.product_id ?? 'none');
    const row = grouped.get(id) ?? {
      id,
      product_name: lot.product_name ?? t('wax.unknownProduct'),
      stock_kg: 0,
      lot_count: 0
    };
    row.stock_kg += lot.stock_kg;
    row.lot_count += 1;
    grouped.set(id, row);
  }
  const query = (filter.value ?? '').toLowerCase();
  return [...grouped.values()].filter(row =>
    row.product_name.toLowerCase().includes(query)
  );
});
const filteredOperations = computed(() => {
  const query = (filter.value ?? '').toLowerCase();
  if (!query) {
    return operations.value;
  }
  return operations.value.filter(operation =>
    [
      operation.type,
      operation.counterparty,
      operation.reference,
      operation.origin_type_name,
      operation.note,
      ...operation.hives.map(hive => hive.name),
      ...operation.hives.map(hive => hive.apiary_name)
    ].some(value => value?.toLowerCase().includes(query))
  );
});

onMounted(refresh);
async function allLots() {
  const result: WaxLotResponse[] = [];
  let page = 0;
  let total = 0;
  do {
    const response = (await api.get('/v1/wax/lots', {
      limit: 500,
      offset: page
    })) as WaxLotListResponse;
    result.push(...response.results);
    total = response.total;
    page++;
  } while (result.length < total);
  return result;
}
async function allOperations() {
  const result: WaxOperationResponse[] = [];
  let page = 0;
  let total = 0;
  do {
    const response = (await api.get('/v1/wax/operations', {
      limit: 500,
      offset: page
    })) as WaxOperationListResponse;
    result.push(...response.results);
    total = response.total;
    page++;
  } while (result.length < total);
  return result;
}
async function refresh() {
  loading.value = true;
  try {
    [lots.value, operations.value] = await Promise.all([
      allLots(),
      allOperations()
    ]);
  } finally {
    loading.value = false;
  }
}
async function reverse(operation: WaxOperationResponse) {
  if (!window.confirm(t('wax.confirmReverse'))) {
    return;
  }
  try {
    await api.post(`/v1/wax/operations/${operation.id}/reverse`, {});
    notification.open('positive', 'success');
    await refresh();
  } catch (error) {
    notification.open('negative', error);
  }
}
function canReverse(operation: WaxOperationResponse) {
  return !operation.reversal_of_id && !reversedIds.value.has(operation.id);
}
function confirmDelete(message: string, action: () => Promise<unknown>) {
  $q.dialog({
    title: t('warning'),
    message,
    persistent: true,
    cancel: {
      label: t('cancel'),
      class: 'wax-delete-cancel'
    },
    ok: {
      label: t('delete'),
      class: 'wax-delete-confirm',
      color: 'negative'
    }
  }).onOk(async () => {
    try {
      await action();
      notification.open('positive', 'success');
      await refresh();
    } catch (error) {
      notification.open('negative', error);
    }
  });
}
function deleteLot(lot: WaxLotResponse) {
  confirmDelete(t('wax.confirmDeleteLot'), () =>
    api.remove(`/v1/wax/lots/${lot.id}`)
  );
}
function deleteOperation(operation: WaxOperationResponse) {
  confirmDelete(t('wax.confirmDeleteOperation'), () =>
    api.remove(`/v1/wax/operations/${operation.id}`)
  );
}
function showHives(hives: WaxOperationResponse['hives']) {
  selectedHives.value = hives;
  hiveDialog.value = true;
}
function operationTypeLabel(operation: WaxOperationResponse) {
  if (operation.reversal_of_id) {
    return t('wax.reversal');
  }
  if (operation.type === 'correction' && !operation.inventory_counts.length) {
    return t('wax.genericCorrection');
  }
  return t(`wax.operationTypes.${operation.type}`);
}
function exportOperations() {
  const escape = (value: unknown) => {
    let text = String(value ?? '');
    if (/^[=+\-@]/.test(text)) {
      text = `'${text}`;
    }
    return `"${text.replaceAll('"', '""')}"`;
  };
  const header = [
    'date',
    'type',
    'input_kg',
    'output_kg',
    'difference_kg',
    'origin',
    'hives',
    'apiaries',
    'counterparty',
    'reference',
    'lines',
    'inventory_counts',
    'note'
  ];
  const rows = operations.value.map(operation => [
    operation.date,
    operationTypeLabel(operation),
    operation.input_kg.toFixed(2),
    operation.output_kg.toFixed(2),
    operation.difference_kg.toFixed(2),
    operation.origin_type_name,
    operation.hives.map(hive => hive.name).join('; '),
    [
      ...new Set(operation.hives.map(hive => hive.apiary_name).filter(Boolean))
    ].join('; '),
    operation.counterparty,
    operation.reference,
    operation.lines
      .map(
        line =>
          `${line.direction}: ${line.lot_code} ${line.quantity_kg.toFixed(2)} kg`
      )
      .join('; '),
    operation.inventory_counts
      .map(
        count =>
          `${count.lot_code}: ${count.ledger_quantity_kg.toFixed(2)} kg -> ${count.counted_quantity_kg.toFixed(2)} kg (${count.adjustment_kg >= 0 ? '+' : ''}${count.adjustment_kg.toFixed(2)} kg)`
      )
      .join('; '),
    operation.note
  ]);
  const csv = [header, ...rows]
    .map(row => row.map(escape).join(','))
    .join('\r\n');
  const exported = exportFile(
    'wachskreislauf.csv',
    `\uFEFF${csv}`,
    'text/csv;charset=utf-8'
  );
  if (!exported) {
    notification.open('warning', t('wax.exportFailed'), true);
  }
}
</script>

<template>
  <div class="q-pa-sm">
    <q-card flat bordered>
      <q-card-section class="row items-center q-gutter-sm">
        <BtnBase
          v-if="!auth.isReadOnly"
          data-cy="wax-book-operation"
          icon="fas fa-plus"
          :label="$t('wax.bookOperation')"
          color="primary"
          @click="dialog = true"
        />
        <BtnBase
          icon="fas fa-download"
          :label="$t('export')"
          flat
          @click="exportOperations"
        />
      </q-card-section>
      <q-tabs v-model="tab" align="left" active-color="primary">
        <q-tab
          data-cy="wax-summary-tab"
          name="summary"
          :label="$t('wax.summary')"
        />
        <q-tab
          data-cy="wax-lots-tab"
          name="lots"
          :label="$t('wax.stockAndLots')"
        />
        <q-tab
          data-cy="wax-operations-tab"
          name="operations"
          :label="$t('wax.operations')"
        />
      </q-tabs>
      <q-separator />
      <q-card-section>
        <div class="row items-center q-gutter-sm q-mb-sm">
          <q-input
            v-model="filter"
            :placeholder="$t('search')"
            dense
            outlined
            clearable
            class="col"
          >
            <template #prepend><q-icon name="fas fa-search" /></template>
          </q-input>
          <q-toggle
            v-if="tab !== 'operations'"
            v-model="showEmpty"
            data-cy="wax-show-empty"
            :label="$t('wax.showEmptyStock')"
          />
        </div>
        <q-table
          v-if="tab === 'summary'"
          v-model:pagination="summaryPagination"
          data-cy="wax-summary-table"
          :rows="summaryRows"
          :columns="summaryColumns"
          :rows-per-page-options="rowsPerPageOptions"
          row-key="id"
          :loading="loading"
          dense
          binary-state-sort
          flat
          bordered
        />
        <q-table
          v-else-if="tab === 'lots'"
          v-model:pagination="lotsPagination"
          data-cy="wax-lots-table"
          :rows="filteredLots"
          :columns="lotColumns"
          :rows-per-page-options="rowsPerPageOptions"
          row-key="id"
          :loading="loading"
          dense
          binary-state-sort
          flat
          bordered
        >
          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                v-if="auth.isAdmin"
                data-cy="wax-delete-lot"
                icon="fas fa-trash"
                color="negative"
                flat
                round
                dense
                size="sm"
                @click="deleteLot(props.row)"
              />
            </q-td>
          </template>
        </q-table>
        <q-table
          v-else
          v-model:pagination="operationsPagination"
          data-cy="wax-operations-table"
          :rows="filteredOperations"
          :columns="operationColumns"
          :rows-per-page-options="rowsPerPageOptions"
          row-key="id"
          :loading="loading"
          dense
          binary-state-sort
          flat
          bordered
        >
          <template #body="props">
            <q-tr :props="props">
              <q-td
                v-for="column in props.cols"
                :key="column.name"
                :props="props"
              >
                <template v-if="column.name === 'actions'">
                  <q-btn
                    v-if="!auth.isReadOnly && canReverse(props.row)"
                    icon="fas fa-rotate-left"
                    color="negative"
                    flat
                    round
                    dense
                    size="sm"
                    @click="reverse(props.row)"
                  />
                  <q-btn
                    v-if="auth.isAdmin"
                    data-cy="wax-delete-operation"
                    icon="fas fa-trash"
                    color="negative"
                    flat
                    round
                    dense
                    size="sm"
                    @click="deleteOperation(props.row)"
                  />
                </template>
                <template v-else>{{ column.value }}</template>
              </q-td>
            </q-tr>
            <q-tr
              v-if="
                props.row.inventory_counts.length ||
                props.row.lines.length ||
                props.row.hives.length
              "
              :props="props"
              class="bg-grey-1"
            >
              <q-td colspan="100%">
                <span
                  v-for="count in props.row.inventory_counts"
                  :key="`inventory-${count.id}`"
                  class="q-mr-md"
                >
                  {{ count.lot_code }}: {{ $t('wax.ledgerStock') }}
                  {{ count.ledger_quantity_kg.toFixed(2) }} kg,
                  {{ $t('wax.countedStock').toLowerCase() }}
                  {{ count.counted_quantity_kg.toFixed(2) }} kg,
                  {{ $t('wax.adjustment').toLowerCase() }}
                  {{ count.adjustment_kg >= 0 ? '+' : ''
                  }}{{ count.adjustment_kg.toFixed(2) }} kg
                </span>
                <span
                  v-for="line in props.row.inventory_counts.length
                    ? []
                    : props.row.lines"
                  :key="line.id"
                  class="q-mr-md"
                >
                  {{ line.direction === 'input' ? '−' : '+' }}
                  {{ line.quantity_kg.toFixed(2) }} kg {{ line.lot_code }} ({{
                    line.product_name
                  }})
                </span>
                <span v-if="props.row.hives.length" class="q-ml-md">
                  {{ $t('hive') }}:
                  {{
                    props.row.hives
                      .slice(0, 3)
                      .map((hive: { name: string }) => hive.name)
                      .join(', ')
                  }}
                  <q-btn
                    v-if="props.row.hives.length > 3"
                    :label="`+${props.row.hives.length - 3}`"
                    flat
                    dense
                    size="sm"
                    color="primary"
                    @click="showHives(props.row.hives)"
                  />
                </span>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
    <WaxOperationDialog v-model="dialog" @saved="refresh" />
    <q-dialog v-model="hiveDialog">
      <q-card style="min-width: 320px; max-width: 90vw">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ $t('wax.selectedHives') }}</div>
          <q-space />
          <q-btn v-close-popup icon="fas fa-xmark" flat round dense />
        </q-card-section>
        <q-separator />
        <q-list separator>
          <q-item v-for="hive in selectedHives" :key="hive.id">
            <q-item-section>
              <q-item-label>{{ hive.name }}</q-item-label>
              <q-item-label v-if="hive.apiary_name" caption>
                {{ hive.apiary_name }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </q-dialog>
  </div>
</template>
