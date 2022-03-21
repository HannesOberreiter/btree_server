<template>
  <q-input
    v-model="state.temp"
    :error="v.temp.$error"
    :error-message="validationErrors(v.temp)"
    :no-error-icon="true"
    :label="t('temperature')"
    name="temp"
    type="number"
    shadow-text=" C°"
    :disable="isLoading"
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
      <q-icon name="fas fa-temperature-high"></q-icon>
    </template>
    <template #after>
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
        :disable="state.temp >= 100"
        @click="state.temp++"
      ></q-btn>
      <q-btn
        round
        flat
        dense
        icon="fas fa-minus"
        style="cursor: pointer"
        :disable="state.temp <= -100"
        @click="state.temp--"
      ></q-btn>
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { minValue, maxValue, decimal } from '~/helpers/i18n-validators';
import { useAuthUserStore } from '~/stores/auth';
import { useI18n } from 'vue-i18n';
import { useTemperatureQuery } from '~/query';
import { useVModels } from '@vueuse/core';
import { validationErrors } from '~/helpers';
import useVuelidate from '@vuelidate/core';

const storeUser = useAuthUserStore();
const { t } = useI18n();
const loadTemp = ref(false);
const select = ref(0);
const {
  isLoading,
  isSuccess,
  data: temperature,
  refetch,
} = useTemperatureQuery(select, {
  enabled: computed(() => select.value != 0 && loadTemp.value),
});
const props = defineProps({
  modelValue: {
    default: null,
  },
  hive: {
    default: [] as any,
  },
});
const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);

const state = reactive({
  temp: modelValue.value ? modelValue.value : 0,
});
const rules = {
  temp: { minValue: minValue(-100), maxValue: maxValue(100), decimal: decimal },
};
const v = useVuelidate(rules, state, { $autoDirty: true });

console.log(props.hive);
if (props.hive.length > 0 && storeUser.getPaidStatus.status === true)
  getTemperature();

watch(props, (cur) => {
  if (cur.modelValue) {
    state.temp = cur.modelValue ? cur.modelValue : state.temp;
  } else {
    state.temp = temperature.value
      ? temperature.value.data_current.temperature
      : state.temp;
  }
  getTemperature();
});

watch(state, (cur) => {
  emit('update:modelValue', cur.temp);
});

watch(temperature, (cur) => {
  if (!props.hive) return;
  if (props.hive.length === 0) return;
  if (cur) {
    state.temp = cur.data_current.temperature;
    loadTemp.value = false;
  }
});

function getTemperature(click = false) {
  if (!props.hive) return;
  if (props.hive.length === 0) return;
  select.value = props.hive.length === 0 ? 0 : props.hive[0].apiary_id;
  state.temp = temperature.value
    ? temperature.value.data_current.temperature
    : state.temp;

  loadTemp.value = true;
  if (click)
    refetch.value().then(
      () => console.log('Loading new temperature from service'),
      (e) => console.log(e)
    );
}
</script>
