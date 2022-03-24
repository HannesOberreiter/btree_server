<template>
  <div class="row">
    <div class="col-xs-12 col-sm-5 q-pr-sm">
      <form-common-start
        v-model="startValue"
        label="dateStart"
        :mark="endValue"
        :disable="modelMultiple"
        @update:model-value="updateStart"
      ></form-common-start>
    </div>
    <div class="col-xs-11 col-sm-5">
      <form-common-end
        v-model="endValue"
        label="dateEnd"
        :mark="startValue"
        :disable="modelMultiple"
        @update:model-value="updateEnd"
      ></form-common-end>
    </div>
    <div v-if="modelMultiple" class="col-1 text-center">
      <btn-multiple-values
        @click="modelMultiple = !modelMultiple"
      ></btn-multiple-values>
    </div>
    <div v-if="!edit" class="col-1 text-center">
      <q-btn
        flat
        round
        icon="fas fa-retweet"
        :color="showInterval ? 'secondary' : 'grey'"
        @click="changeInterval"
      ></q-btn>
    </div>
  </div>
  <div v-if="showInterval" class="row">
    <div class="col-6">
      <q-input
        v-model.number="modelInterval"
        type="number"
        :error="v.interval.$error"
        :error-message="validationErrors(v.interval)"
        :no-error-icon="true"
        :label="t('interval')"
        :hint="t('intervalText')"
        :shadow-text="t('day', 2)"
        filled
      >
        <template #append>
          <q-btn
            round
            flat
            dense
            icon="fas fa-plus"
            style="cursor: pointer"
            :disable="modelInterval >= 365"
            @click="modelInterval++"
          ></q-btn>
          <q-btn
            round
            flat
            dense
            icon="fas fa-minus"
            style="cursor: pointer"
            :disable="modelInterval <= 0"
            @click="modelInterval--"
          ></q-btn>
        </template>
      </q-input>
    </div>
    <div class="col-6 q-pl-sm">
      <q-input
        v-model.number="modelRepeat"
        type="number"
        :error="v.repeat.$error"
        :error-message="validationErrors(v.repeat)"
        :no-error-icon="true"
        :label="t('repeat')"
        :hint="t('repeatText')"
        shadow-text="x"
        filled
      >
        <template #append>
          <q-btn
            round
            flat
            dense
            icon="fas fa-plus"
            style="cursor: pointer"
            :disable="modelRepeat >= 50"
            @click="modelRepeat++"
          ></q-btn>
          <q-btn
            round
            flat
            dense
            icon="fas fa-minus"
            style="cursor: pointer"
            :disable="modelRepeat <= 0"
            @click="modelRepeat--"
          ></q-btn>
        </template>
      </q-input>
    </div>
  </div>
</template>

<script setup lang="ts">
import { minValue, maxValue, integer } from '~/helpers/i18n-validators';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { validationErrors } from '~/helpers';
import dayjs from 'dayjs';
import FormCommonEnd from './FormCommonDate.vue';
import FormCommonStart from './FormCommonDate.vue';
import useVuelidate from '@vuelidate/core';
import { useVModels } from '@vueuse/core';
import BtnMultipleValues from './BtnMultipleValues.vue';

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
  modelInterval: {
    default: 0,
  },
  modelRepeat: {
    default: 0,
  },
  modelMultiple: {
    default: false,
  },
  edit: {
    default: false,
  },
});
const emit = defineEmits([
  'update:startValue',
  'update:endValue',
  'update:modelInterval',
  'update:modelRepeat',
  'update:modelMultiple',
]);
const { startValue, endValue, modelInterval, modelRepeat, modelMultiple } =
  useVModels(props, emit);

const showInterval = ref(false);

const state = {
  interval: modelInterval,
  repeat: modelRepeat,
};

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

function updateStart(val: string) {
  if (dayjs(val) > dayjs(endValue.value)) endValue.value = val;
}
function updateEnd(val: string) {
  if (dayjs(startValue.value) > dayjs(val)) startValue.value = val;
}

function changeInterval() {
  if (showInterval.value) {
    modelInterval.value = 0;
    modelRepeat.value = 0;
  }
  showInterval.value = !showInterval.value;
}
</script>
