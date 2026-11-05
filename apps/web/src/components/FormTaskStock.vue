<script setup lang="ts">
import type { PropType } from 'vue';
import type {
  OptionListItem,
  RecipeTable,
  TaskStockLine,
  TaskStockRow
} from '@/api/types';
import type { Task } from '@/types';
import { find, round, sumBy } from 'lodash-es';
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useOptionsQuery, useRecipeQuery } from '@/composables/useQuery';

const props = defineProps({
  task: {
    type: String as PropType<Task>,
    required: true
  },
  typeId: {
    type: Number as PropType<number | null>,
    default: null
  },
  // Amount per hive.
  amount: {
    type: Number,
    default: 0
  },
  // Number of task rows the save creates or changes.
  rows: {
    type: Number,
    default: 0
  },
  done: {
    type: Boolean,
    default: true
  },
  // Task row before the edit (single edit only).
  current: {
    type: Object as PropType<TaskStockRow | null>,
    default: null
  },
  reset: {
    type: Number,
    default: 0
  }
});

// `undefined`: the server books from the recipe. `[]`: no booking.
const model = defineModel<TaskStockLine[] | undefined>();

const { t, locale } = useI18n();

const recipeTable = computed(() => `${props.task}_types` as RecipeTable);
const { data: recipe } = useRecipeQuery(recipeTable);
const { data: chargeTypeData } = useOptionsQuery('charge_types', {});
const chargeTypes = computed<OptionListItem[]>(
  () => chargeTypeData.value?.results ?? []
);

watch(
  () => props.reset,
  () => {
    model.value = undefined;
  }
);

const currentLines = computed<TaskStockLine[]>(() =>
  (props.current?.charges ?? []).flatMap(charge =>
    charge.charge_type_id === null || charge.amount === null
      ? []
      : [
          {
            charge_type_id: charge.charge_type_id,
            kind: charge.kind === 'in' ? 'in' : 'out',
            amount: charge.amount
          }
        ]
  )
);

const recipeLines = computed<TaskStockLine[]>(() =>
  (recipe.value ?? [])
    .filter(line => line.type_id === props.typeId)
    .map(line => ({
      charge_type_id: line.charge_type_id,
      kind: line.kind,
      amount: round(
        line.mode === 'per_hive' ? line.factor : line.factor * props.amount,
        2
      )
    }))
    .filter(line => line.amount > 0)
);

// Same rules as the server when the request has no `charges` field.
const preview = computed<TaskStockLine[]>(() => {
  if (!props.done) {
    return [];
  }
  const current = props.current;
  if (!current || !current.done) {
    return recipeLines.value;
  }
  const changed =
    props.typeId !== current.type_id ||
    props.amount !== Number(current.amount ?? 0);
  if (changed && currentLines.value.length > 0) {
    return recipeLines.value;
  }
  return currentLines.value;
});

const isSkipped = computed(() => model.value !== undefined);

function toggle() {
  model.value = isSkipped.value ? undefined : [];
}

function format(value: number) {
  return new Intl.NumberFormat(locale.value, {
    maximumFractionDigits: 2
  }).format(value);
}

const chips = computed(() =>
  preview.value.map(line => {
    const type = find(chargeTypes.value, { id: line.charge_type_id });
    const unit = type?.unit ?? '';
    const sign = line.kind === 'out' ? 1 : -1;
    const total = line.amount * props.rows;
    // The bookings of the edited task are already in the stock.
    const change =
      sign * total -
      sumBy(currentLines.value, row =>
        row.charge_type_id === line.charge_type_id
          ? (row.kind === 'out' ? 1 : -1) * row.amount
          : 0
      );
    const after = Number(type?.stock?.sum ?? 0) - change;
    const negative = type !== undefined && change > 0 && after < 0;
    return {
      key: `${line.charge_type_id}-${line.kind}`,
      label: `${sign > 0 ? '−' : '+'}${format(total)} ${unit} ${type?.name ?? ''}`,
      negative,
      after: t('stockUse.negative', { amount: format(after), unit })
    };
  })
);
const iconColor = computed(() => {
  if (isSkipped.value) {
    return 'grey-5';
  }
  return chips.value.some(chip => chip.negative) ? 'negative' : 'primary';
});
</script>

<template>
  <!-- A plain icon keeps the size of the dropdown icon it replaces. -->
  <q-icon
    v-if="chips.length > 0"
    name="fas fa-warehouse"
    :color="iconColor"
    class="cursor-pointer"
    role="button"
    tabindex="0"
    :aria-label="$t('stockUse.title')"
    data-cy="btn-task-stock"
  >
    <q-menu>
      <div class="q-pa-sm text-caption" style="max-width: 300px">
        <q-chip
          v-for="chip in chips"
          :key="chip.key"
          dense
          outline
          clickable
          :color="chip.negative && !isSkipped ? 'negative' : 'grey-7'"
          :class="{ 'text-strike': isSkipped }"
          :aria-pressed="!isSkipped"
          data-cy="chip-task-stock"
          @click="toggle"
        >
          {{ chip.label }}
        </q-chip>
        <div class="text-grey-7 q-px-xs">
          {{ $t(isSkipped ? 'stockUse.skipped' : 'stockUse.book') }}
        </div>
        <template v-for="chip in chips" :key="chip.key">
          <div v-if="chip.negative && !isSkipped" class="text-negative q-px-xs">
            {{ chip.after }}
          </div>
        </template>
      </div>
    </q-menu>
  </q-icon>
  <!-- Same icon as the dropdown shows without a recipe. -->
  <q-icon v-else name="far fa-square-caret-down" />
</template>
