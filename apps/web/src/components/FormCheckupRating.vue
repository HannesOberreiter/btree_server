<template>
  <div class="row q-pb-sm">
    <template v-for="(_value, index) of state" :key="index">
      <q-input
        v-model="state[index]"
        :label="t('rating.' + index)"
        :error="v[index].$error"
        type="number"
        filled
        dense
        no-error-icon
        :shadow-text="' ' + t('rating.text')"
        class="col-6 col-sm-3 col-lg-2 q-pa-xs"
      >
        <template v-if="index === 'brood'" v-slot:before>
          <q-icon name="fas fa-star"></q-icon>
        </template>
      </q-input>
    </template>
  </div>
</template>

<script setup lang="ts">
import { integer, maxValue, minValue } from 'src/helpers/i18n-validators';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import useVuelidate from '@vuelidate/core';

const { t } = useI18n();
const state = ref({
  brood: null,
  pollen: null,
  comb: null,
  temper: null,
  calm_comb: null,
  swarm: null,
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
