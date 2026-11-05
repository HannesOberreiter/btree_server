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
  // `null` in an edit: each task keeps its own value.
  typeId: {
    type: Number as PropType<number | null>,
    default: null
  },
  // Amount per hive.
  amount: {
    type: Number as PropType<number | null>,
    default: 0
  },
  // Number of task rows the save creates.
  rows: {
    type: Number,
    default: 0
  },
  done: {
    type: Boolean as PropType<boolean | null>,
    default: true
  },
  // Task rows before the edit, empty on create.
  current: {
    type: Array as PropType<TaskStockRow[]>,
    default: () => []
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

function bookedLines(row: TaskStockRow): TaskStockLine[] {
  return (row.charges ?? []).flatMap(charge =>
    charge.charge_type_id === null || charge.amount === null
      ? []
      : [
          {
            charge_type_id: charge.charge_type_id,
            kind: charge.kind === 'in' ? 'in' : 'out',
            amount: charge.amount
          }
        ]
  );
}

function recipeLines(typeId: number | null, amount: number): TaskStockLine[] {
  return (recipe.value ?? [])
    .filter(line => line.type_id === typeId)
    .map(line => ({
      charge_type_id: line.charge_type_id,
      kind: line.kind,
      amount: round(
        line.mode === 'per_hive' ? line.factor : line.factor * amount,
        2
      )
    }))
    .filter(line => line.amount > 0);
}

// Same rules as the server when the request has no `charges` field.
function taskPreview(row: TaskStockRow): TaskStockLine[] {
  const typeId = props.typeId ?? row.type_id ?? null;
  const amount = props.amount ?? Number(row.amount ?? 0);
  if (!(props.done ?? row.done)) {
    return [];
  }
  if (!row.done) {
    return recipeLines(typeId, amount);
  }
  // A type change books from the new recipe, also without bookings.
  if (typeId !== row.type_id) {
    return recipeLines(typeId, amount);
  }
  const booked = bookedLines(row);
  const changed = amount !== Number(row.amount ?? 0);
  return changed && booked.length > 0 ? recipeLines(typeId, amount) : booked;
}

const isCreate = computed(() => props.current.length === 0);

// The icon shows only when all tasks have the same type.
const sameType = computed(
  () =>
    new Set(props.current.map(row => props.typeId ?? row.type_id ?? null))
      .size <= 1
);

const currentLines = computed(() => props.current.flatMap(bookedLines));

const bookedTasks = computed(
  () => props.current.filter(row => bookedLines(row).length > 0).length
);

// Lines of all tasks, summed per charge type and kind.
const preview = computed<TaskStockLine[]>(() => {
  if (isCreate.value) {
    return props.done
      ? recipeLines(props.typeId, props.amount ?? 0).map(line => ({
          ...line,
          amount: line.amount * props.rows
        }))
      : [];
  }
  const totals = new Map<string, TaskStockLine>();
  for (const line of props.current.flatMap(taskPreview)) {
    const key = `${line.charge_type_id}-${line.kind}`;
    const total = totals.get(key);
    totals.set(key, {
      ...line,
      amount: round((total?.amount ?? 0) + line.amount, 2)
    });
  }
  return [...totals.values()];
});

const isSkipped = computed(() => model.value !== undefined);

const statusKey = computed(() => {
  if (isSkipped.value) {
    return 'stockUse.skipped';
  }
  return bookedTasks.value > 0 ? 'stockUse.booked' : 'stockUse.book';
});

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
    const total = line.amount;
    // The bookings of the edited tasks are already in the stock.
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
    v-if="sameType && chips.length > 0"
    name="fas fa-warehouse"
    :color="iconColor"
    class="cursor-pointer"
    role="button"
    tabindex="0"
    :aria-label="$t('stockUse.title')"
    data-cy="btn-task-stock"
  >
    <!-- Open below the type field, not over it. -->
    <q-menu anchor="bottom left" self="top left" :offset="[0, 16]">
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
          {{ $t(statusKey) }}
        </div>
        <div
          v-if="isSkipped && bookedTasks > 0"
          class="text-warning q-px-xs"
          data-cy="task-stock-remove-warning"
        >
          {{ $t('stockUse.removeWarning', bookedTasks) }}
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
