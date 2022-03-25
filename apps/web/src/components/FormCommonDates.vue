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
      <form-common-numeric-interval
        v-model.number="modelInterval"
        label="interval"
        :hint="$t('intervalText')"
        :shadow-text="$t('day', 2)"
        :max-valid="365"
        icon=""
        numeric-valid="integer"
      ></form-common-numeric-interval>
    </div>
    <div class="col-6 q-pl-sm">
      <form-common-numeric-repeat
        v-model.number="modelRepeat"
        label="repeat"
        :hint="$t('repeatText')"
        shadow-text="x"
        icon=""
        numeric-valid="integer"
      ></form-common-numeric-repeat>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import dayjs from 'dayjs';
import FormCommonEnd from './FormCommonDate.vue';
import FormCommonStart from './FormCommonDate.vue';
import { useVModels } from '@vueuse/core';
import BtnMultipleValues from './BtnMultipleValues.vue';
import FormCommonNumericInterval from './FormCommonNumeric.vue';
import FormCommonNumericRepeat from './FormCommonNumeric.vue';

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
