<template>
  <div class="row q-pb-sm">
    <q-expansion-item
      v-model="expanded"
      icon="fas fa-star"
      class="full-width"
      :label="$t('rating.name')"
      :class="some(modelValue, (val) => val > 0) ? 'bg-orange' : ''"
    >
      <q-card>
        <q-card-section>
          <template v-for="(_value, index) of modelValue" :key="index">
            <div
              v-if="
                fields.settings.checkup.ratings[index] ||
                fields.settings.checkup?.rating
              "
              class="row q-pb-xs"
            >
              <div class="col-4">{{ $t('rating.' + index) }}</div>
              <div class="col-5 col-sm-5 col-lg-3">
                <q-rating
                  v-model="modelValue[index]"
                  :error="v[index].$error"
                  color-selected="positive"
                  color="grey"
                  :disable="disable[index]"
                  size="sm"
                  :max="fields.settings.checkup.ratings.max"
                >
                </q-rating>
              </div>
              <div class="col-2 col-sm-2">
                <btn-base-group round flat dense>
                  <btn-base
                    icon="fas fa-plus"
                    :disable="
                      modelValue[index] >=
                        fields.settings.checkup.ratings.max || disable[index]
                    "
                    @click="
                      modelValue[index] = round(modelValue[index] + 0.1, 1)
                    "
                  ></btn-base>
                  <btn-base
                    icon="fas fa-minus"
                    :disable="modelValue[index] <= 0 || disable[index]"
                    @click="
                      modelValue[index] = round(modelValue[index] - 0.1, 1)
                    "
                  ></btn-base>
                </btn-base-group>
              </div>
              <div class="col-2 col-sm-1">
                {{ round(modelValue[index], 1) }}
                <btn-multiple-values
                  v-if="multipleValues[index]"
                  :disable="disable[index]"
                  @click="editValues(!disable[index], index)"
                ></btn-multiple-values>
              </div>
            </div>
          </template>
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </div>
</template>

<script setup lang="ts">
import { numeric, maxValue, minValue } from '~/helpers/i18n-validators';
import { isEmpty, some, round } from 'lodash-es';
import useVuelidate from '@vuelidate/core';
import { useVModels } from '@vueuse/core';
import { formCheckMultipleValues } from '~/helpers';
import { useFieldsettingStore } from '~/stores/fieldsetting';
import { ref, computed, toRefs, unref, watch, PropType } from 'vue';

const fields = useFieldsettingStore();
const expanded = ref(false);
const props = defineProps({
  modelValue: {
    type: null as unknown as PropType<unknown | null>,
    validator: (v: any) => typeof v === 'object' || v === null,
    default: {
      brood: 0,
      pollen: 0,
      comb: 0,
      temper: 0,
      calm_comb: 0,
      swarm: 0,
    },
  },
  reset: {
    type: Number,
    default: 0,
  },
  values: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);
const resetValue = { ...unref(modelValue.value) };
const { values, reset } = toRefs(props);
const multipleValues = computed(() => {
  return {
    brood: formCheckMultipleValues(values.value, 'brood'),
    pollen: formCheckMultipleValues(values.value, 'pollen'),
    comb: formCheckMultipleValues(values.value, 'comb'),
    temper: formCheckMultipleValues(values.value, 'temper'),
    calm_comb: formCheckMultipleValues(values.value, 'calm_comb'),
    swarm: formCheckMultipleValues(values.value, 'swarm'),
  };
});
const disable = ref({ ...unref(multipleValues.value) });
for (const [key, value] of Object.entries(multipleValues.value)) {
  editValues(value, key);
}

const rules = {
  brood: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    numeric: numeric,
  },
  pollen: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    numeric: numeric,
  },
  comb: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    numeric: numeric,
  },
  temper: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    numeric: numeric,
  },
  calm_comb: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    numeric: numeric,
  },
  swarm: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    numeric: numeric,
  },
};

const v = useVuelidate(rules, modelValue, { $autoDirty: true });

watch(values, () => {
  setValues();
});

watch(reset, () => {
  setValues();
});

function setValues() {
  disable.value = { ...unref(multipleValues.value) };
  for (const [key, value] of Object.entries(multipleValues.value)) {
    if (value) editValues(true, key);
    else if (values.value && !isEmpty(values.value))
      modelValue.value[key as keyof typeof modelValue.value] =
        values.value[0][key];
    else
      modelValue.value[key as keyof typeof modelValue.value] =
        resetValue[key as keyof typeof resetValue];
  }
}

function editValues(val: boolean, key: string) {
  disable.value[key as keyof typeof disable.value] = val;
  modelValue.value[key as keyof typeof modelValue.value] = val
    ? null
    : modelValue.value[key as keyof typeof modelValue.value];
}
</script>
