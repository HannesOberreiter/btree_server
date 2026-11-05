<script setup lang="ts">
import type { PropType } from 'vue';
import type { OptionListItem, RecipeLineBody, RecipeTable } from '@/api/types';
import type { SugarWaterMix } from '@/helpers/sugarWater';
import useVuelidate from '@vuelidate/core';
import { helpers } from '@vuelidate/validators';
import { cloneDeep, find, isEqual, round } from 'lodash-es';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import BtnBase from '@/components/BtnBase.vue';
import { useApiFetch } from '@/composables/useApi';
import { useNotification } from '@/composables/useNotification';
import {
  useInvalidateQueries,
  useOptionsQuery,
  useRecipeQuery
} from '@/composables/useQuery';
import { sugarPerSolution } from '@/helpers/sugarWater';

const props = defineProps({
  table: {
    type: String as PropType<RecipeTable>,
    required: true
  },
  // `null` while the type is not created yet.
  typeId: {
    type: Number as PropType<number | null>,
    default: null
  },
  typeName: {
    type: String,
    default: ''
  },
  unit: {
    type: String as PropType<string | null>,
    default: null
  }
});

const { t } = useI18n();
const api = useApiFetch();
const notification = useNotification();
const useInvalidate = useInvalidateQueries();
const { data: recipe } = useRecipeQuery(computed(() => props.table));
const { data: chargeTypeData } = useOptionsQuery('charge_types', {});
const chargeTypes = computed<OptionListItem[]>(
  () => chargeTypeData.value?.results ?? []
);

// Checkup types have no amount, so their lines are per hive.
const mode = computed(() =>
  props.table === 'checkup_types' ? 'per_hive' : 'per_amount'
);
const lines = ref<RecipeLineBody[]>([]);
const savedLines = ref<RecipeLineBody[]>([]);

watch(
  [recipe, () => props.typeId],
  () => {
    savedLines.value = (recipe.value ?? [])
      .filter(line => line.type_id === props.typeId)
      .map(line => ({
        charge_type_id: line.charge_type_id,
        kind: line.kind,
        mode: line.mode,
        factor: line.factor
      }));
    lines.value = cloneDeep(savedLines.value);
  },
  { immediate: true }
);

// Registers with the parent form, so an invalid factor blocks its save.
const v = useVuelidate(
  {
    lines: {
      factor: helpers.withMessage(
        () => t('stockUse.factorInvalid'),
        (value: RecipeLineBody[]) => value.every(line => line.factor > 0)
      )
    }
  },
  { lines },
  { $autoDirty: true }
);

const kindOptions = computed(() => [
  { label: t('stockUse.out'), value: 'out' },
  { label: t('stockUse.in'), value: 'in' }
]);

const sugarWaterOptions: { label: string; mix?: SugarWaterMix }[] = [
  { label: 'stockUse.sugarOneToOne', mix: 'oneToOne' },
  { label: 'stockUse.sugarThreeToTwo', mix: 'threeToTwo' },
  { label: 'stockUse.sugarKg' }
];

function chargeType(id: number) {
  return find(chargeTypes.value, { id });
}

function addLine() {
  const first = chargeTypes.value[0];
  if (!first) {
    return;
  }
  lines.value.push({
    charge_type_id: first.id,
    kind: props.table === 'harvest_types' ? 'in' : 'out',
    mode: mode.value,
    factor: 1
  });
}

function setSugarFactor(line: RecipeLineBody, mix?: SugarWaterMix) {
  line.factor = mix ? round(sugarPerSolution(mix), 2) : 1;
}

// Called by the option form after it saved the type.
async function save(typeId: number) {
  if (isEqual(lines.value, savedLines.value)) {
    return;
  }
  await api
    .patch(`/v1/option/${props.table}/${typeId}/recipe`, {
      lines: lines.value
    })
    .then(
      () => {
        useInvalidate.invalidate('option');
      },
      error => {
        notification.open('negative', error);
      }
    );
}

defineExpose({ save });
</script>

<template>
  <div class="q-pt-sm" data-cy="form-stock-recipe">
    <div class="text-subtitle2">{{ $t('stockUse.title') }}</div>
    <div class="text-caption text-grey-7 q-pb-sm">
      {{ $t('stockUse.recipeHint') }}
    </div>
    <div
      v-for="(line, index) in lines"
      :key="index"
      class="row items-center q-col-gutter-sm q-py-xs"
    >
      <div class="col-12 text-body2">
        {{
          mode === 'per_hive'
            ? $t('stockUse.forEachHive')
            : $t('stockUse.forAmount', {
                unit: unit || $t('unit'),
                name: typeName
              })
        }}
      </div>
      <div class="col-6 col-sm-4">
        <q-input
          v-model.number="line.factor"
          type="number"
          min="0"
          step="any"
          dense
          filled
          :error="v.$dirty && !(line.factor > 0)"
          hide-bottom-space
          :suffix="chargeType(line.charge_type_id)?.unit ?? undefined"
        >
          <template v-if="table === 'feed_types'" #append>
            <q-btn-dropdown
              flat
              dense
              round
              dropdown-icon="fas fa-calculator"
              :aria-label="$t('sugarwater')"
            >
              <q-list dense>
                <q-item
                  v-for="option in sugarWaterOptions"
                  :key="option.label"
                  v-close-popup
                  clickable
                  @click="setSugarFactor(line, option.mix)"
                >
                  <q-item-section>{{ $t(option.label) }}</q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </template>
        </q-input>
      </div>
      <div class="col-6 col-sm-4">
        <q-select
          v-model="line.charge_type_id"
          :options="chargeTypes"
          option-value="id"
          :option-label="(row: OptionListItem) => row.name ?? ''"
          emit-value
          map-options
          dense
          filled
          :label="$t('charge')"
        />
      </div>
      <div class="col-10 col-sm-3">
        <q-select
          v-model="line.kind"
          :options="kindOptions"
          emit-value
          map-options
          dense
          filled
          :label="$t('kind')"
        />
      </div>
      <div class="col-2 col-sm-1 text-right">
        <BtnBase
          flat
          round
          dense
          icon="fas fa-trash"
          :aria-label="$t('delete')"
          @click="lines.splice(index, 1)"
        />
      </div>
    </div>
    <div class="row items-center q-pt-xs">
      <BtnBase
        flat
        dense
        size="sm"
        icon="fas fa-plus"
        :label="$t('stockUse.addLine')"
        :disable="chargeTypes.length === 0"
        @click="addLine"
      />
    </div>
    <div v-if="chargeTypes.length === 0" class="text-caption text-grey-7">
      {{ $t('stockUse.noChargeTypes') }}
    </div>
  </div>
</template>
