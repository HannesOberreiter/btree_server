<script setup lang="ts">
import type { WaxLotListResponse, WaxLotResponse } from '../api/types';
import dayjs from 'dayjs';
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApiFetch } from '../composables/useApi';
import { useNotification } from '../composables/useNotification';
import FormDropdownHive from './FormDropdownHive.vue';
import FormDropdownOption from './FormDropdownOption.vue';

interface OptionRow {
  id: number;
  name: string;
}
interface InputLine {
  lot: WaxLotResponse | null;
  quantity_kg: number | null;
}
interface OutputLine {
  product: OptionRow | null;
  code: string;
  quantity_kg: number | null;
}
interface InventoryCountLine {
  lot: WaxLotResponse | null;
  counted_quantity_kg: number | null;
}

const model = defineModel<boolean>({ required: true });
const emit = defineEmits<{ saved: [] }>();
const api = useApiFetch();
const notification = useNotification();
const { t } = useI18n();
const saving = ref(false);
const submitted = ref(false);
const dropdownReset = ref(0);
const lots = ref<WaxLotResponse[]>([]);
let lotsRequest = 0;

const operationTypes = computed(() => [
  { label: t('wax.operationTypes.production'), value: 'production' },
  { label: t('wax.operationTypes.purchase'), value: 'purchase' },
  { label: t('wax.operationTypes.processing'), value: 'processing' },
  {
    label: t('wax.operationTypes.contract_processing'),
    value: 'contract_processing'
  },
  { label: t('wax.operationTypes.use'), value: 'use' },
  { label: t('wax.operationTypes.sale'), value: 'sale' },
  { label: t('wax.operationTypes.correction'), value: 'correction' }
]);

const state = reactive({
  date: dayjs().format('YYYY-MM-DD'),
  type: operationTypes.value[0]!,
  counterparty: '',
  reference: '',
  note: '',
  origin: null as OptionRow | null,
  hives: [] as Array<{ id: number }>,
  inputs: [] as InputLine[],
  outputs: [] as OutputLine[],
  inventoryCounts: [] as InventoryCountLine[],
  openingStocks: [] as OutputLine[]
});

const isInventory = computed(() => state.type.value === 'correction');
const needsInputs = computed(() =>
  ['processing', 'contract_processing', 'use', 'sale'].includes(
    state.type.value
  )
);
const needsOutputs = computed(() =>
  ['production', 'purchase', 'processing', 'contract_processing'].includes(
    state.type.value
  )
);
const needsCounterparty = computed(() =>
  ['purchase', 'contract_processing'].includes(state.type.value)
);
const inputKg = computed(() =>
  state.inputs.reduce((sum, line) => sum + (Number(line.quantity_kg) || 0), 0)
);
const outputKg = computed(() =>
  state.outputs.reduce((sum, line) => sum + (Number(line.quantity_kg) || 0), 0)
);
const differenceKg = computed(() => inputKg.value - outputKg.value);
const selectableLots = computed(() =>
  isInventory.value ? lots.value : lots.value.filter(lot => lot.stock_kg > 0)
);
const needsMassGainNote = computed(
  () =>
    ['processing', 'contract_processing'].includes(state.type.value) &&
    outputKg.value > inputKg.value
);

watch(
  () => state.type.value,
  async () => {
    setLines();
    if (model.value) {
      await loadLots(isInventory.value ? state.date : undefined);
    }
  },
  { immediate: true }
);
watch(
  () => state.date,
  async () => {
    if (model.value && isInventory.value) {
      await loadLots(state.date);
    }
  }
);
watch(model, async open => {
  if (open) {
    resetForm();
    await loadLots();
  }
});

async function loadLots(asOf?: string) {
  const request = ++lotsRequest;
  const result: WaxLotResponse[] = [];
  let page = 0;
  let total = 0;
  do {
    const response = (await api.get('/v1/wax/lots', {
      limit: 500,
      offset: page,
      as_of: asOf
    })) as WaxLotListResponse;
    result.push(...response.results);
    total = response.total;
    page++;
  } while (result.length < total);
  if (request !== lotsRequest) {
    return;
  }
  lots.value = result;
  for (const line of state.inventoryCounts) {
    if (line.lot) {
      line.lot = result.find(lot => lot.id === line.lot!.id) ?? null;
    }
  }
}

function resetForm() {
  submitted.value = false;
  state.date = dayjs().format('YYYY-MM-DD');
  state.type = operationTypes.value[0]!;
  state.counterparty = '';
  state.reference = '';
  state.note = '';
  state.origin = null;
  state.hives = [];
  setLines();
  dropdownReset.value++;
}
function setLines() {
  state.inputs = needsInputs.value ? [{ lot: null, quantity_kg: null }] : [];
  state.outputs = needsOutputs.value
    ? [{ product: null, code: '', quantity_kg: null }]
    : [];
  state.inventoryCounts = [];
  state.openingStocks = [];
  if (state.type.value !== 'production') {
    state.origin = null;
  }
  if (!['production', 'use'].includes(state.type.value)) {
    state.hives = [];
  }
  if (!needsCounterparty.value) {
    state.counterparty = '';
  }
}
function addInput() {
  state.inputs.push({ lot: null, quantity_kg: null });
}
function addOutput() {
  state.outputs.push({ product: null, code: '', quantity_kg: null });
}
function addInventoryCount() {
  state.inventoryCounts.push({ lot: null, counted_quantity_kg: null });
}
function addOpeningStock() {
  state.openingStocks.push({ product: null, code: '', quantity_kg: null });
}
function lotLabel(lot: WaxLotResponse) {
  return `${lot.code} · ${lot.product_name ?? ''} · ${lot.stock_kg.toFixed(2)} kg`;
}

function validQuantity(value: number | null) {
  const quantity = Number(value);
  return (
    Number.isFinite(quantity) &&
    quantity >= 0.01 &&
    Math.abs(quantity * 100 - Math.round(quantity * 100)) < 0.000_001
  );
}
function validCountedQuantity(value: number | null) {
  if (typeof value !== 'number') {
    return false;
  }
  const quantity = Number(value);
  return (
    Number.isFinite(quantity) &&
    quantity >= 0 &&
    Math.abs(quantity * 100 - Math.round(quantity * 100)) < 0.000_001
  );
}
function inventoryAdjustment(line: InventoryCountLine) {
  return Number(line.counted_quantity_kg) - (line.lot?.stock_kg ?? 0);
}
function inventoryLotOptions(index: number) {
  const selectedIds = new Set(
    state.inventoryCounts.flatMap((line, lineIndex) =>
      lineIndex !== index && line.lot ? [line.lot.id] : []
    )
  );
  return lots.value.filter(lot => !selectedIds.has(lot.id));
}
function requiredLabel(key: string) {
  return `${t(key)} *`;
}
function optionalLabel(key: string, plural = 1) {
  return `${t(key, plural)} (${t('wax.optional')})`;
}
function requiredMessage(key: string) {
  return t('validations.required', { field: t(key) });
}

async function save() {
  submitted.value = true;
  if (!state.date) {
    return invalid();
  }
  if (state.type.value === 'production' && !state.origin?.id) {
    return invalid();
  }
  if (
    needsInputs.value &&
    state.inputs.some(line => !line.lot || !validQuantity(line.quantity_kg))
  ) {
    return invalid();
  }
  if (
    needsOutputs.value &&
    state.outputs.some(
      line => !line.product?.id || !validQuantity(line.quantity_kg)
    )
  ) {
    return invalid();
  }
  if (needsCounterparty.value && !state.counterparty.trim()) {
    return invalid();
  }
  if (needsMassGainNote.value && !state.note.trim()) {
    return invalid();
  }
  if (isInventory.value) {
    const lotIds = state.inventoryCounts.flatMap(line =>
      line.lot ? [line.lot.id] : []
    );
    if (
      !state.note.trim() ||
      state.inventoryCounts.length + state.openingStocks.length === 0 ||
      new Set(lotIds).size !== lotIds.length ||
      state.inventoryCounts.some(
        line => !line.lot || !validCountedQuantity(line.counted_quantity_kg)
      ) ||
      state.openingStocks.some(
        line => !line.product?.id || !validQuantity(line.quantity_kg)
      )
    ) {
      return invalid();
    }
  }
  saving.value = true;
  try {
    if (isInventory.value) {
      await api.post('/v1/wax/operations/inventory', {
        date: state.date,
        reference: state.reference || null,
        note: state.note.trim(),
        counts: state.inventoryCounts.map(line => ({
          lot_id: line.lot!.id,
          counted_quantity_kg: Number(line.counted_quantity_kg)
        })),
        opening_stocks: state.openingStocks.map(line => ({
          code: line.code || undefined,
          product_id: line.product!.id,
          counted_quantity_kg: Number(line.quantity_kg)
        }))
      });
    } else {
      await api.post('/v1/wax/operations', {
        date: state.date,
        type: state.type.value,
        counterparty: needsCounterparty.value
          ? state.counterparty || null
          : null,
        reference: state.reference || null,
        note: state.note || null,
        origin_type_id:
          state.type.value === 'production' ? (state.origin?.id ?? null) : null,
        hive_ids: ['production', 'use'].includes(state.type.value)
          ? state.hives.map(hive => hive.id)
          : [],
        inputs: state.inputs.map(line => ({
          lot_id: line.lot!.id,
          quantity_kg: Number(line.quantity_kg)
        })),
        outputs: state.outputs.map(line => ({
          code: line.code || undefined,
          product_id: line.product!.id,
          quantity_kg: Number(line.quantity_kg)
        }))
      });
    }
    notification.open('positive', 'success');
    model.value = false;
    emit('saved');
  } catch (error) {
    notification.open('negative', error);
  } finally {
    saving.value = false;
  }
}
function invalid() {
  notification.open('warning', t('wax.completeRequired'), true);
}
</script>

<template>
  <q-dialog v-model="model" :maximized="$q.platform.is.mobile" persistent>
    <q-card
      data-cy="wax-operation-dialog"
      :style="
        $q.platform.is.mobile ? undefined : `width: 700px; max-width: 80vw;`
      "
    >
      <q-card-section class="row items-center">
        <div class="text-h6">{{ $t('wax.bookOperation') }}</div>
        <q-space />
        <q-btn v-close-popup icon="fas fa-xmark" flat round dense />
      </q-card-section>
      <q-separator />
      <q-card-section :class="['q-gutter-md', { col: $q.platform.is.mobile }]">
        <q-select
          v-model="state.type"
          data-cy="wax-operation-type"
          :options="operationTypes"
          :label="requiredLabel('wax.operationType')"
          filled
        />
        <q-input
          v-model="state.date"
          data-cy="wax-operation-date"
          type="date"
          :label="requiredLabel('date')"
          :error="submitted && !state.date"
          :error-message="requiredMessage('date')"
          no-error-icon
          filled
        />

        <FormDropdownOption
          v-if="state.type.value === 'production'"
          v-model="state.origin"
          data-cy="wax-origin-type"
          table="wax_origin_types"
          label="wax.originType"
          :reset="dropdownReset"
          :show-keyboard="false"
          required
          :error="submitted && !state.origin?.id"
          :error-message="requiredMessage('wax.originType')"
        />
        <div v-if="['production', 'use'].includes(state.type.value)">
          <div
            data-cy="wax-hives-optional"
            class="text-caption text-grey-7 q-mb-xs"
          >
            {{ optionalLabel('hive', 2) }}
          </div>
          <FormDropdownHive v-model="state.hives" :required="false" />
        </div>
        <q-input
          v-if="needsCounterparty"
          v-model="state.counterparty"
          data-cy="wax-counterparty"
          :label="requiredLabel('wax.counterparty')"
          :error="submitted && !state.counterparty.trim()"
          :error-message="requiredMessage('wax.counterparty')"
          no-error-icon
          filled
        />
        <q-input
          v-model="state.reference"
          data-cy="wax-reference"
          :label="optionalLabel('wax.reference')"
          filled
        />

        <section v-if="needsInputs">
          <div class="row items-center q-mb-sm">
            <div class="text-subtitle1">
              {{ requiredLabel('wax.inputs') }}
            </div>
            <q-space />
            <q-btn
              icon="fas fa-plus"
              :label="$t('add')"
              color="primary"
              flat
              dense
              @click="addInput"
            />
          </div>
          <div
            v-for="(line, index) in state.inputs"
            :key="`input-${index}`"
            class="row q-col-gutter-sm q-mb-sm"
          >
            <q-select
              v-model="line.lot"
              data-cy="wax-input-lot"
              class="col-12 col-sm-8"
              :options="selectableLots"
              :option-label="lotLabel"
              :label="requiredLabel('wax.lot')"
              :error="submitted && !line.lot"
              :error-message="requiredMessage('wax.lot')"
              no-error-icon
              filled
            />
            <q-input
              v-model.number="line.quantity_kg"
              data-cy="wax-input-quantity"
              class="col-10 col-sm-3"
              type="number"
              min="0.01"
              step="0.01"
              suffix="kg"
              :label="requiredLabel('amount')"
              :error="submitted && !validQuantity(line.quantity_kg)"
              :error-message="$t('wax.invalidQuantity')"
              no-error-icon
              filled
            />
            <q-btn
              class="col-2 col-sm-1"
              icon="fas fa-trash"
              flat
              round
              :disable="state.inputs.length === 1"
              @click="state.inputs.splice(index, 1)"
            />
          </div>
        </section>

        <section v-if="needsOutputs">
          <div class="row items-center q-mb-sm">
            <div class="text-subtitle1">
              {{ requiredLabel('wax.outputs') }}
            </div>
            <q-space />
            <q-btn
              icon="fas fa-plus"
              :label="$t('add')"
              color="primary"
              flat
              dense
              @click="addOutput"
            />
          </div>
          <div
            v-for="(line, index) in state.outputs"
            :key="`output-${index}`"
            class="row q-col-gutter-sm q-mb-sm"
          >
            <FormDropdownOption
              v-model="line.product"
              data-cy="wax-output-product"
              class="col-12 col-sm-5"
              table="wax_products"
              label="wax.product"
              :show-keyboard="false"
              required
              :error="submitted && !line.product?.id"
              :error-message="requiredMessage('wax.product')"
            />
            <q-input
              v-model="line.code"
              data-cy="wax-lot-code"
              class="col-12 col-sm-4"
              :label="optionalLabel('wax.lotCode')"
              :hint="$t('wax.generatedIfEmpty')"
              filled
            />
            <q-input
              v-model.number="line.quantity_kg"
              data-cy="wax-output-quantity"
              class="col-10 col-sm-2"
              type="number"
              min="0.01"
              step="0.01"
              suffix="kg"
              :label="requiredLabel('amount')"
              :error="submitted && !validQuantity(line.quantity_kg)"
              :error-message="$t('wax.invalidQuantity')"
              no-error-icon
              filled
            />
            <q-btn
              class="col-2 col-sm-1"
              icon="fas fa-trash"
              flat
              round
              :disable="state.outputs.length === 1"
              @click="state.outputs.splice(index, 1)"
            />
          </div>
        </section>

        <template v-if="isInventory">
          <q-banner rounded class="bg-blue-1">
            {{ $t('wax.inventoryHint') }}
          </q-banner>

          <section>
            <div class="row items-center q-mb-sm">
              <div class="text-subtitle1">{{ $t('wax.inventoryCounts') }}</div>
              <q-space />
              <q-btn
                data-cy="wax-add-inventory-count"
                icon="fas fa-plus"
                :label="$t('add')"
                color="primary"
                flat
                dense
                @click="addInventoryCount"
              />
            </div>
            <div
              v-for="(line, index) in state.inventoryCounts"
              :key="`inventory-${index}`"
              class="row q-col-gutter-sm q-mb-sm items-start"
            >
              <q-select
                v-model="line.lot"
                data-cy="wax-inventory-lot"
                class="col-12 col-sm-5"
                :options="inventoryLotOptions(index)"
                :option-label="lotLabel"
                :label="requiredLabel('wax.lot')"
                :error="submitted && !line.lot"
                :error-message="requiredMessage('wax.lot')"
                no-error-icon
                filled
              />
              <q-input
                v-model.number="line.counted_quantity_kg"
                data-cy="wax-counted-quantity"
                class="col-10 col-sm-3"
                type="number"
                min="0"
                step="0.01"
                suffix="kg"
                :label="requiredLabel('wax.countedStock')"
                :error="
                  submitted && !validCountedQuantity(line.counted_quantity_kg)
                "
                :error-message="$t('wax.invalidCountedQuantity')"
                no-error-icon
                filled
              />
              <div class="col-12 col-sm-3 text-caption q-pt-sm">
                <template v-if="line.lot">
                  {{ $t('wax.ledgerStock') }}:
                  {{ line.lot.stock_kg.toFixed(2) }} kg<br />
                  <template
                    v-if="validCountedQuantity(line.counted_quantity_kg)"
                  >
                    {{ $t('wax.adjustment') }}:
                    {{ inventoryAdjustment(line) >= 0 ? '+' : ''
                    }}{{ inventoryAdjustment(line).toFixed(2) }} kg
                  </template>
                </template>
              </div>
              <q-btn
                class="col-2 col-sm-1"
                icon="fas fa-trash"
                flat
                round
                @click="state.inventoryCounts.splice(index, 1)"
              />
            </div>
          </section>

          <section>
            <div class="row items-center q-mb-sm">
              <div class="text-subtitle1">{{ $t('wax.openingStocks') }}</div>
              <q-space />
              <q-btn
                data-cy="wax-add-opening-stock"
                icon="fas fa-plus"
                :label="$t('add')"
                color="primary"
                flat
                dense
                @click="addOpeningStock"
              />
            </div>
            <div
              v-for="(line, index) in state.openingStocks"
              :key="`opening-${index}`"
              class="row q-col-gutter-sm q-mb-sm"
            >
              <FormDropdownOption
                v-model="line.product"
                data-cy="wax-opening-product"
                class="col-12 col-sm-5"
                table="wax_products"
                label="wax.product"
                :show-keyboard="false"
                required
                :error="submitted && !line.product?.id"
                :error-message="requiredMessage('wax.product')"
              />
              <q-input
                v-model="line.code"
                data-cy="wax-opening-lot-code"
                class="col-12 col-sm-3"
                :label="optionalLabel('wax.lotCode')"
                :hint="$t('wax.generatedIfEmpty')"
                filled
              />
              <q-input
                v-model.number="line.quantity_kg"
                data-cy="wax-opening-quantity"
                class="col-10 col-sm-3"
                type="number"
                min="0.01"
                step="0.01"
                suffix="kg"
                :label="requiredLabel('wax.countedStock')"
                :error="submitted && !validQuantity(line.quantity_kg)"
                :error-message="$t('wax.invalidQuantity')"
                no-error-icon
                filled
              />
              <q-btn
                class="col-2 col-sm-1"
                icon="fas fa-trash"
                flat
                round
                @click="state.openingStocks.splice(index, 1)"
              />
            </div>
          </section>
        </template>

        <q-banner
          v-if="needsInputs && needsOutputs"
          rounded
          :class="differenceKg < 0 ? 'bg-orange-2' : 'bg-grey-2'"
        >
          {{ $t('wax.massBalance') }}: {{ inputKg.toFixed(2) }} kg −
          {{ outputKg.toFixed(2) }} kg =
          <strong>{{ differenceKg.toFixed(2) }} kg</strong>
        </q-banner>
        <q-input
          v-model="state.note"
          data-cy="wax-note"
          type="textarea"
          :label="
            needsMassGainNote || isInventory
              ? requiredLabel('note')
              : optionalLabel('note')
          "
          :hint="
            isInventory
              ? $t('wax.inventoryReasonRequired')
              : needsMassGainNote
                ? $t('wax.massGainNoteRequired')
                : ''
          "
          :error="
            submitted &&
            (needsMassGainNote || isInventory) &&
            !state.note.trim()
          "
          :error-message="
            isInventory
              ? $t('wax.inventoryReasonRequired')
              : $t('wax.massGainNoteRequired')
          "
          no-error-icon
          filled
        />
        <div data-cy="wax-required-hint" class="text-caption text-grey-7">
          {{ $t('wax.requiredFieldHint') }}
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right">
        <q-btn v-close-popup :label="$t('cancel')" flat />
        <q-btn
          data-cy="wax-save"
          :label="$t('save')"
          color="primary"
          :loading="saving"
          @click="save"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
