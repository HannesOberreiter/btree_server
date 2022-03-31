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
            <div class="row q-pb-xs">
              <div class="col-3">{{ $t('rating.' + index) }}</div>
              <div class="col-9">
                <q-rating
                  v-model="modelValue[index]"
                  :error="v[index].$error"
                  color-selected="positive"
                  color="grey"
                  :disable="disable[index]"
                  size="sm"
                >
                </q-rating>
                {{ modelValue[index] }}
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
import { integer, maxValue, minValue } from '~/helpers/i18n-validators';
import { computed, PropType, ref, toRefs, unref, watch } from 'vue';
import { isEmpty, some } from 'lodash';
import useVuelidate from '@vuelidate/core';
import { useVModels } from '@vueuse/core';
import BtnMultipleValues from './BtnMultipleValues.vue';
import { formCheckMultipleValues } from '~/helpers';

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
const disable = ref(multipleValues.value);
for (const [key, value] of Object.entries(multipleValues.value)) {
  editValues(value, key);
}

const rules = {
  brood: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    integer: integer,
  },
  pollen: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    integer: integer,
  },
  comb: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    integer: integer,
  },
  temper: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    integer: integer,
  },
  calm_comb: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    integer: integer,
  },
  swarm: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    integer: integer,
  },
};

const v = useVuelidate(rules, modelValue, { $autoDirty: true });

watch(multipleValues, () => {
  for (const [key, value] of Object.entries(multipleValues.value)) {
    editValues(value, key);
  }
});

watch(reset, () => {
  for (const [key, value] of Object.entries(multipleValues.value)) {
    if (value) editValues(true, key);
    else if (values.value && !isEmpty(values.value))
      modelValue.value[key as keyof typeof modelValue.value] =
        values.value[0][key];
    else
      modelValue.value[key as keyof typeof modelValue.value] =
        resetValue[key as keyof typeof resetValue];
  }
});

function editValues(val: boolean, key: string) {
  disable.value[key as keyof typeof disable.value] = val;
  modelValue.value[key as keyof typeof modelValue.value] = disable.value[
    key as keyof typeof disable.value
  ]
    ? null
    : modelValue.value[key as keyof typeof modelValue.value];
}
</script>
