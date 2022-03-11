<template>
  <div class="row">
    <div class="col-xs-12 col-sm-5 q-pr-sm">
      <form-common-start
        v-model="state.start"
        label="dateStart"
        :mark="state.end"
        @update:model-value="updateStart"
      ></form-common-start>
    </div>
    <div class="col-xs-11 col-sm-5">
      <form-common-end
        v-model="state.end"
        label="dateEnd"
        :mark="state.start"
        @update:model-value="updateEnd"
      ></form-common-end>
    </div>
    <div class="col-1 text-center">
      <q-btn
        flat
        round
        icon="fas fa-retweet"
        @click="changeInterval"
        :color="showInterval ? 'secondary' : 'grey'"
      ></q-btn>
    </div>
  </div>
  <div v-if="showInterval" class="row">
    <div class="col-6">
      <q-input
        v-model.number="state.interval"
        type="number"
        :error="v.interval.$error"
        :error-message="validationErrors(v.interval)"
        :no-error-icon="true"
        :label="t('interval')"
        :hint="t('intervalText')"
        input-class="text-right"
        filled
      >
      </q-input>
    </div>
    <div class="col-6 q-pl-sm">
      <q-input
        v-model.number="state.repeat"
        type="number"
        :error="v.repeat.$error"
        :error-message="validationErrors(v.repeat)"
        :no-error-icon="true"
        :label="t('repeat')"
        :hint="t('repeatText')"
        input-class="text-right"
        filled
      >
      </q-input>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';
import FormCommonStart from './FormCommonDate.vue';
import FormCommonEnd from './FormCommonDate.vue';
import { minValue, maxValue, integer } from '../helpers/i18n-validators';
import { validationErrors } from '../helpers';
import useVuelidate from '@vuelidate/core';

const { t } = useI18n();
const props = defineProps({
  startValue: {
    type: String,
    default: dayjs().format('YYYY-MM-DD'),
  },
  endValue: {
    type: String,
    default: dayjs().format('YYYY-MM-DD'),
  },
});

const showInterval = ref(false);

const state = ref({
  start: props.startValue,
  end: props.endValue,
  interval: 0,
  repeat: 0,
});

const rules = {
  interval: {
    minValue: minValue(0),
    maxValue: maxValue(365),
    integer: integer,
  },
  repeat: {
    minValue: minValue(0),
    maxValue: maxValue(50),
    integer: integer,
  },
};

const v = useVuelidate(rules, state, { $autoDirty: true });

function updateStart() {
  if (dayjs(state.value.start) > dayjs(state.value.end))
    state.value.end = state.value.start;
}
function updateEnd() {
  if (dayjs(state.value.start) > dayjs(state.value.end))
    state.value.start = state.value.end;
}

function changeInterval() {
  if (showInterval.value) {
    state.value.interval = 0;
    state.value.repeat = 0;
  }
  showInterval.value = !showInterval.value;
}
</script>
