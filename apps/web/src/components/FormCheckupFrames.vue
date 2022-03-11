<template>
  <div class="row q-pb-sm">
    <template v-for="(_value, index) of state" :key="index">
      <q-input
        v-model="state[index]"
        :label="t('frames.' + index)"
        :error="v[index].$error"
        type="number"
        filled
        no-error-icon
        :shadow-text="' ' + t('frames.text')"
        class="col-6 col-sm-3 col-lg-2 q-pa-xs"
      >
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
  broodframes: null,
  honeyframes: null,
  foundation: null,
  emptyframes: null,
});

const rules = {
  broodframes: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    integer: integer,
  },
  honeyframes: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    integer: integer,
  },
  foundation: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    integer: integer,
  },
  emptyframes: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    integer: integer,
  },
};

const v = useVuelidate(rules, state, { $autoDirty: true });
</script>
