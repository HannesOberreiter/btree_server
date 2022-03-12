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
    filled
  >
    <template v-slot:before>
      <q-spinner-hourglass flat round v-if="isLoading"></q-spinner-hourglass>
      <q-btn
        v-else
        flat
        round
        icon="fas fa-temperature-high"
        style="cursor: pointer"
        @click="getTemperature"
        :disable="hive.length === 0"
      ></q-btn>
    </template>
    <template v-slot:append>
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
import useVuelidate from '@vuelidate/core';
import { minValue, maxValue, decimal } from '../helpers/i18n-validators';
import { computed, reactive, ref, watch } from 'vue';
import { validationErrors } from '../helpers';
import { useI18n } from 'vue-i18n';
import { useVModels } from '@vueuse/core';
import { useTemperatureQuery } from 'src/query';

const { t } = useI18n();
const loadTemp = ref(false);
const props = defineProps({
  modelValue: {
    default: 0,
  },
  hive: {
    default: [] as any,
  },
});
const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);

const state = reactive({
  temp: modelValue.value,
});
const rules = {
  temp: { minValue: minValue(-100), maxValue: maxValue(100), decimal: decimal },
};
const v = useVuelidate(rules, state, { $autoDirty: true });

watch(props, (cur) => {
  state.temp = cur.modelValue;
  select.value = props.hive.length === 0 ? 0 : props.hive[0].apiary_id;
});

watch(state, (cur) => {
  emit('update:modelValue', cur.temp);
});

const select = ref(0);
const {
  isLoading,
  data: temperature,
  refetch,
} = useTemperatureQuery(select, {
  enabled: loadTemp,
});

watch(isLoading, (cur) => {
  console.log(temperature.value);
  console.log(isLoading.value);
  if (!isLoading.value) {
    state.temp = temperature.value;
  }
  loadTemp.value = false;
});

async function getTemperature() {
  if (props.hive.length === 0) return;
  loadTemp.value = true;
  await refetch.value();
}
</script>
