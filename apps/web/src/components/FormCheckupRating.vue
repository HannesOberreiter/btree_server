<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { useVModels } from '@vueuse/core';
import { isEmpty, round, some } from 'lodash-es';
import { computed, ref, toRefs, unref, watch } from 'vue';
import { formCheckMultipleValues } from '../helpers';
import { maxValue, minValue, numeric } from '../helpers/i18n-validators';
import { useFieldsettingStore } from '../stores/fieldsetting';
import BtnBase from './BtnBase.vue';
import BtnBaseGroup from './BtnBaseGroup.vue';
import BtnMultipleValues from './BtnMultipleValues.vue';

const props = defineProps({
  modelValue: {
    validator: (v: any) => typeof v === 'object' || v === null,
    default: {
      brood: 0 as number | null,
      pollen: 0 as number | null,
      comb: 0 as number | null,
      temper: 0 as number | null,
      calm_comb: 0 as number | null,
      swarm: 0 as number | null
    }
  },
  reset: {
    type: Number,
    default: 0
  },
  values: {
    type: Object,
    default: null
  }
});
const emit = defineEmits(['update:modelValue']);
const fields = useFieldsettingStore();
const expanded = ref(false);
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
    swarm: formCheckMultipleValues(values.value, 'swarm')
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
    numeric
  },
  pollen: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    numeric
  },
  comb: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    numeric
  },
  temper: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    numeric
  },
  calm_comb: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    numeric
  },
  swarm: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    numeric
  }
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
    if (value) {
      editValues(true, key);
    } else if (values.value && !isEmpty(values.value)) {
      modelValue.value[key as keyof typeof modelValue.value] =
        values.value[0][key];
    } else {
      modelValue.value[key as keyof typeof modelValue.value] =
        resetValue[key as keyof typeof resetValue];
    }
  }
}

function editValues(val: boolean, key: string) {
  disable.value[key as keyof typeof disable.value] = val;
  modelValue.value[key as keyof typeof modelValue.value] = val
    ? null
    : modelValue.value[key as keyof typeof modelValue.value];
}
</script>

<template>
  <div class="row q-pb-sm">
    <q-expansion-item
      v-model="expanded"
      icon="fas fa-star"
      class="full-width"
      :label="$t('rating.name')"
      :class="
        some(modelValue, val => val != null && val > 0) ? 'bg-orange' : ''
      "
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
              <div class="col-4">
                {{ $t(`rating.${index}`) }}
                <b>{{ round(modelValue[index] ?? 0, 1) }}</b>
              </div>
              <div class="col-5 col-sm-5 col-lg-3">
                <q-rating
                  v-if="modelValue[index] != null"
                  v-model="modelValue[index]"
                  :error="v[index].$error"
                  color-selected="positive"
                  color="grey"
                  :disable="disable[index]"
                  size="sm"
                  :max="fields.settings.checkup.ratings.max"
                />
              </div>
              <div class="col-2 col-sm-2">
                <BtnBaseGroup round flat dense>
                  <BtnBase
                    icon="fas fa-plus"
                    :disabled="
                      (modelValue[index] != null &&
                        modelValue[index] >=
                          fields.settings.checkup.ratings.max) ||
                      disable[index]
                    "
                    @click="
                      modelValue[index] = round(
                        (modelValue[index] ?? 0) + 0.1,
                        1
                      )
                    "
                  />
                  <BtnBase
                    icon="fas fa-minus"
                    :disabled="(modelValue[index] ?? 0) <= 0 || disable[index]"
                    @click="
                      modelValue[index] = round(
                        (modelValue[index] ?? 0) - 0.1,
                        1
                      )
                    "
                  />
                </BtnBaseGroup>
              </div>
              <div class="col-2 col-sm-1">
                <BtnMultipleValues
                  v-if="multipleValues[index]"
                  :disable="disable[index]"
                  @click="editValues(!disable[index], index)"
                />
              </div>
            </div>
          </template>
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </div>
</template>
