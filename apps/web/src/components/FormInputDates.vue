<template>
  <div class="row">
    <div class="col-xs-12 col-sm-5 q-pr-sm">
      <date-start
        v-model="startValue"
        label="dateStart"
        :mark="endValue"
        :disable="disable"
        @update:model-value="updateStart"
      ></date-start>
    </div>
    <div class="col-xs-11 col-sm-5">
      <date-end
        v-model="endValue"
        label="dateEnd"
        :mark="startValue"
        :disable="disable"
        @update:model-value="updateEnd"
      ></date-end>
    </div>
    <div v-if="!values" class="col-1 text-center">
      <btn-multiple-values
        :disable="disable"
        @click="editValues(!disable)"
      ></btn-multiple-values>
    </div>
    <div v-if="multipleValues" class="col-1 text-center">
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
      <input-interval
        v-model.number="modelInterval"
        label="interval"
        :hint="$t('intervalText')"
        :shadow-text="$t('day', 2)"
        :max-valid="365"
        icon=""
        numeric-valid="integer"
      ></input-interval>
    </div>
    <div class="col-6 q-pl-sm">
      <input-repeat
        v-model.number="modelRepeat"
        label="repeat"
        :hint="$t('repeatText')"
        shadow-text="x"
        icon=""
        numeric-valid="integer"
      ></input-repeat>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRefs, unref, watch } from 'vue';
import dayjs from 'dayjs';
import DateEnd from './FormInputDate.vue';
import DateStart from './FormInputDate.vue';
import { useVModels } from '@vueuse/core';
import BtnMultipleValues from './BtnMultipleValues.vue';
import InputInterval from './FormInputNumeric.vue';
import InputRepeat from './FormInputNumeric.vue';
import { formCheckMultipleValues } from '~/helpers';

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
  reset: {
    type: Number,
    default: 0,
  },
  values: {
    type: Object,
    default: null,
  },
});
const emit = defineEmits([
  'update:startValue',
  'update:endValue',
  'update:modelInterval',
  'update:modelRepeat',
]);
const { startValue, endValue, modelInterval, modelRepeat } = useVModels(
  props,
  emit
);
const showInterval = ref(false);
const resetStart = unref(startValue.value);
const resetEnd = unref(endValue.value);
const { values, reset } = toRefs(props);
const multipleValues = computed(
  () =>
    formCheckMultipleValues(values.value, 'date') ||
    formCheckMultipleValues(values.value, 'enddate')
);
const disable = ref(multipleValues.value);
startValue.value = disable.value ? null : startValue.value;
endValue.value = disable.value ? null : endValue.value;

watch(multipleValues, () => {
  editValues(multipleValues.value);
});

watch(reset, () => {
  if (multipleValues.value) editValues(true);
  else {
    startValue.value = resetStart;
    endValue.value = resetEnd;
  }
});

function editValues(val: boolean) {
  disable.value = val;
  startValue.value = disable.value ? null : startValue.value;
  endValue.value = disable.value ? null : endValue.value;
}

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
