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
      <q-icon name="fas fa-temperature-high"></q-icon>
    </template>
    <template v-slot:after>
      <q-spinner-hourglass flat round v-if="isLoading"></q-spinner-hourglass>
      <q-btn
        v-else
        flat
        round
        icon="fas fa-broadcast-tower"
        style="cursor: pointer"
        @click="getTemperature"
        :disable="hive.length === 0 || storeUser.getPaidStatus.status === false"
        :color="
          hive.length === 0 || storeUser.getPaidStatus.status === false
            ? ''
            : 'orange'
        "
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
import { reactive, ref, watch } from 'vue';
import { validationErrors } from '../helpers';
import { useI18n } from 'vue-i18n';
import { useVModels } from '@vueuse/core';
import { useTemperatureQuery } from 'src/query';
import { useAuthUserStore } from 'src/stores/auth';

const storeUser = useAuthUserStore();
const { t } = useI18n();
const loadTemp = ref(false);
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

watch(props, (cur) => {
  state.temp = cur.modelValue ? cur.modelValue : state.temp;
  select.value = props.hive.length === 0 ? 0 : props.hive[0].apiary_id;
});

watch(state, (cur) => {
  emit('update:modelValue', cur.temp);
});

const select = ref(0);
const { isLoading, data: temperature } = useTemperatureQuery(select, {
  enabled: loadTemp,
});

watch(temperature, (cur) => {
  state.temp = cur;
  loadTemp.value = false;
});

function getTemperature() {
  if (props.hive.length === 0) return;
  state.temp = temperature.value ? temperature.value : state.temp;
  loadTemp.value = true;
}
</script>
