<template>
  <q-input
    v-model.number="modelValue"
    :error="v.temp.$error"
    :error-message="validationErrors(v.temp)"
    :no-error-icon="true"
    :label="t('temperature')"
    name="temp"
    type="number"
    shadow-text=" C°"
    :disable="isLoading || modelMultiple"
    :hint="
      isSuccess && hive.length > 0
        ? t('temperatureHint', {
            height: temperature.metadata.height,
            lat: temperature.metadata.latitude,
            lon: temperature.metadata.longitude,
          })
        : ''
    "
    filled
  >
    <template #before>
      <q-icon v-if="!modelMultiple" name="fas fa-temperature-high"></q-icon>
      <btn-multiple-values
        v-else
        @click="modelMultiple = !modelMultiple"
      ></btn-multiple-values>
    </template>
    <template v-if="!edit" #after>
      <q-spinner-hourglass v-if="isLoading" flat round></q-spinner-hourglass>
      <q-btn
        v-else
        flat
        round
        icon="fas fa-broadcast-tower"
        style="cursor: pointer"
        :disable="hive.length === 0 || storeUser.getPaidStatus.status === false"
        :color="
          hive.length === 0 || storeUser.getPaidStatus.status === false
            ? ''
            : 'orange'
        "
        @click="getTemperature(true)"
      ></q-btn>
    </template>
    <template #append>
      <q-btn
        round
        flat
        dense
        icon="fas fa-plus"
        style="cursor: pointer"
        :disable="modelValue >= 100"
        @click="modelValue++"
      ></q-btn>
      <q-btn
        round
        flat
        dense
        icon="fas fa-minus"
        style="cursor: pointer"
        :disable="modelValue <= -100"
        @click="modelValue--"
      ></q-btn>
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { minValue, maxValue, decimal } from '~/helpers/i18n-validators';
import { useAuthUserStore } from '~/stores/auth';
import { useI18n } from 'vue-i18n';
import { useTemperatureQuery } from '~/query';
import { useVModels } from '@vueuse/core';
import { validationErrors } from '~/helpers';
import useVuelidate from '@vuelidate/core';
import { round } from 'lodash';
import BtnMultipleValues from './BtnMultipleValues.vue';

const storeUser = useAuthUserStore();
const { t } = useI18n();
const loadTemp = ref(false);
const select = ref(0);

const props = defineProps({
  modelValue: {
    default: 0,
  },
  hive: {
    default: [] as any,
  },
  modelMultiple: {
    default: false,
  },
  edit: {
    default: false,
  },
});
const {
  isLoading,
  isSuccess,
  data: temperature,
  refetch,
} = useTemperatureQuery(select, {
  enabled: computed(
    () => select.value != 0 && loadTemp.value && props.edit === false
  ),
});
const emit = defineEmits(['update:modelValue', 'update:modelMultiple']);
const { modelValue, modelMultiple } = useVModels(props, emit);

const state = {
  temp: modelValue.value,
};
const rules = {
  temp: { minValue: minValue(-100), maxValue: maxValue(100), decimal: decimal },
};
const v = useVuelidate(rules, state, { $autoDirty: true });

if (props.hive.length > 0 && storeUser.getPaidStatus.status === true)
  getTemperature();

watch(
  () => props.hive,
  () => {
    getTemperature();
  }
);

watch(
  () => modelValue.value,
  (cur) => {
    modelValue.value = round(cur, 1);
  }
);

watch(temperature, (cur) => {
  if (!props.hive) return;
  if (props.hive.length === 0) return;
  if (cur) {
    modelValue.value = cur.data_current.temperature;
    loadTemp.value = false;
  }
});

function getTemperature(click = false) {
  if (!props.hive) return;
  if (props.hive.length === 0) return;
  select.value = props.hive.length === 0 ? 0 : props.hive[0].apiary_id;
  modelValue.value = temperature.value
    ? temperature.value.data_current.temperature
    : modelValue.value;

  loadTemp.value = true;
  if (click)
    refetch.value().then(
      () => console.log('Loading new temperature from service'),
      (e) => console.log(e)
    );
}
</script>
