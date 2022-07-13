<template>
  <div class="row">
    <div class="col-xs-12 col-sm-6 q-pr-sm">
      <form-input-date
        v-model="startValue"
        label="dateStart"
        :mark="endValue"
        :disable="disable"
        @update:model-value="updateStart"
      ></form-input-date>
    </div>
    <div class="col-xs-11 col-sm-6">
      <form-input-date
        v-model="endValue"
        label="dateEnd"
        :mark="startValue"
        :disable="disable"
        @update:model-value="updateEnd"
      >
        <template #deepAfter>
          <div v-if="!values || !isEmpty(values)">
            <btn-multiple-values
              v-if="multipleValues"
              :disable="disable"
              @click="editValues(!disable)"
            ></btn-multiple-values>
          </div>
          <div v-else>
            <q-icon
              style="cursor: pointer"
              name="fas fa-retweet"
              :color="showInterval ? 'secondary' : 'grey'"
              @click="changeInterval"
            ></q-icon>
          </div>
        </template>
      </form-input-date>
    </div>
  </div>
  <div v-if="showInterval" class="row q-mb-lg">
    <div class="col-6">
      <form-input-numeric
        v-model.number="modelInterval"
        label="interval"
        :hint="$t('intervalText')"
        :shadow-text="$t('day', 2)"
        :max-valid="365"
        icon="fas fa-calendar-week"
        numeric-valid="integer"
      ></form-input-numeric>
    </div>
    <div class="col-6 q-pl-sm">
      <form-input-numeric
        v-model.number="modelRepeat"
        label="repeat"
        :hint="$t('repeatText')"
        shadow-text="x"
        icon="fas fa-infinity"
        numeric-valid="integer"
      ></form-input-numeric>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { useVModels } from '@vueuse/core';
import { formCheckMultipleValues } from '~/helpers';
import { isEmpty } from 'lodash-es';

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

watch(values, () => {
  setValues();
});

watch(reset, () => {
  setValues();
});

function setValues() {
  disable.value = multipleValues.value;

  if (multipleValues.value) editValues(true);
  else if (values.value && !isEmpty(values.value)) {
    startValue.value = dayjs(values.value[0]['date']).format('YYYY-MM-DD');
    endValue.value = dayjs(values.value[0]['enddate']).format('YYYY-MM-DD');
  } else {
    startValue.value = resetStart;
    endValue.value = resetEnd;
  }
}

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
