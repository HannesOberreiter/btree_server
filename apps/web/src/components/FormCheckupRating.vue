<template>
  <div class="row q-pb-sm">
    <q-expansion-item
      v-model="expanded"
      icon="fas fa-star"
      class="full-width"
      :label="t('rating.name')"
      :class="some(state, (val) => val > 0) ? 'bg-orange' : ''"
    >
      <q-card>
        <q-card-section>
          <template v-for="(_value, index) of state" :key="index">
            <div class="row q-pb-xs">
              <div class="col-3">{{ t('rating.' + index) }}</div>
              <div class="col-9">
                <q-rating
                  v-model="state[index]"
                  :error="v[index].$error"
                  color-selected="positive"
                  color="grey"
                  size="sm"
                >
                </q-rating>
                {{ state[index] }}
              </div>
            </div>
          </template>
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </div>
</template>

<script setup lang="ts">
import { integer, maxValue, minValue } from 'src/helpers/i18n-validators';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import useVuelidate from '@vuelidate/core';
import { some } from 'lodash';

const { t } = useI18n();
const expanded = ref(false);
const state = ref({
  brood: 0,
  pollen: 0,
  comb: 0,
  temper: 0,
  calm_comb: 0,
  swarm: 0,
});

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

const v = useVuelidate(rules, state, { $autoDirty: true });
</script>
