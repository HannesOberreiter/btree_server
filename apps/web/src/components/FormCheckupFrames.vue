<template>
  <div class="row q-pb-sm">
    <q-expansion-item
      v-model="expanded"
      icon="fas fa-window-maximize"
      class="full-width"
      :label="t('frames.text')"
      :class="some(state, (val) => val > 0) ? 'bg-orange' : ''"
    >
      <q-card>
        <q-card-section>
          <template v-for="(_value, index) of state" :key="index">
            <div class="row q-pb-xs">
              <div class="col-3">{{ t('frames.' + index) }}</div>
              <div class="col-9">
                <q-slider
                  v-model="state[index]"
                  :error="v[index].$error"
                  :step="1"
                  :min="0"
                  :max="max"
                  size="sm"
                >
                </q-slider>
                {{ state[index] }}
              </div>
            </div>
          </template>
          <div class="row q-pb-xs">
            <div class="col-12">
              <q-btn class="float-right" no-caps @click="max = max + 10">
                {{ t('frames.extend') }} ({{ t('max') }}: {{ max }})
              </q-btn>
              <q-btn class="float-right" no-caps @click="max = 20">
                {{ t('reset') }}
              </q-btn>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </div>
</template>

<script setup lang="ts">
import { integer, maxValue, minValue } from '../helpers/i18n-validators';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import useVuelidate from '@vuelidate/core';
import { some } from 'lodash';

const { t } = useI18n();
const expanded = ref(false);
const max = ref(20);
const state = ref({
  broodframes: 0,
  honeyframes: 0,
  foundation: 0,
  emptyframes: 0,
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
