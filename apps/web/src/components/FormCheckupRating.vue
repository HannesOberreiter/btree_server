<template>
  <div class="row q-pb-sm">
    <q-expansion-item
      v-model="expanded"
      icon="fas fa-star"
      class="full-width"
      :label="t('rating.name')"
      :class="some(modelValue, (val) => val > 0) ? 'bg-orange' : ''"
    >
      <q-card>
        <q-card-section>
          <template v-for="(_value, index) of modelValue" :key="index">
            <div class="row q-pb-xs">
              <div class="col-3">{{ t('rating.' + index) }}</div>
              <div class="col-9">
                <q-rating
                  v-model="modelValue[index]"
                  :error="v[index].$error"
                  color-selected="positive"
                  color="grey"
                  :disable="modelMultiple[index]"
                  size="sm"
                >
                </q-rating>
                {{ modelValue[index] }}
                <btn-multiple-values
                  v-if="modelMultiple[index]"
                  @click="modelMultiple[index] = !modelMultiple[index]"
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
import { ref } from 'vue';
import { some } from 'lodash';
import { useI18n } from 'vue-i18n';
import useVuelidate from '@vuelidate/core';
import { useVModels } from '@vueuse/core';
import BtnMultipleValues from './BtnMultipleValues.vue';

const { t } = useI18n();
const expanded = ref(false);
const props = defineProps({
  modelValue: {
    default: {
      brood: 0,
      pollen: 0,
      comb: 0,
      temper: 0,
      calm_comb: 0,
      swarm: 0,
    },
  },
  modelMultiple: {
    default: {
      brood: false,
      pollen: false,
      comb: false,
      temper: false,
      calm_comb: false,
      swarm: false,
    },
  },
});

const emit = defineEmits(['update:modelValue', 'update:modelMultiple']);
const { modelValue, modelMultiple } = useVModels(props, emit);

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
</script>
