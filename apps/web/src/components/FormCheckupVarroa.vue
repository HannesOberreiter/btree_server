<template>
  <q-input
    v-model="state.varroa"
    :error="v.varroa.$error"
    :error-message="validationErrors(v.varroa)"
    :no-error-icon="true"
    :label="t('varroa')"
    name="varroa"
    type="number"
    filled
  >
    <template #before>
      <q-icon name="fas fa-bug"></q-icon>
    </template>
    <template #after>
      <q-btn
        flat
        round
        icon="fas fa-calculator"
        style="cursor: pointer"
        @click="openCalculator"
      ></q-btn>
    </template>
    <template #append>
      <q-btn
        round
        flat
        dense
        icon="fas fa-plus"
        style="cursor: pointer"
        @click="state.varroa++"
      ></q-btn>
      <q-btn
        round
        flat
        dense
        icon="fas fa-minus"
        style="cursor: pointer"
        :disable="state.varroa <= 0"
        @click="state.varroa--"
      ></q-btn>
    </template>
  </q-input>
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { minValue, maxValue, numeric } from '../helpers/i18n-validators';
import { reactive, watch } from 'vue';
import { validationErrors } from '../helpers';
import { useI18n } from 'vue-i18n';
import { useVModels } from '@vueuse/core';
import { useQuasar } from 'quasar';
import DialogVarroa from './DialogVarroa.vue';

const { t } = useI18n();
const $q = useQuasar();
const props = defineProps({
  modelValue: {
    default: 0,
  },
});
const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);

const state = reactive({
  varroa: modelValue.value,
});
const rules = {
  varroa: { minValue: minValue(0), maxValue: maxValue(100), numeric: numeric },
};
const v = useVuelidate(rules, state, { $autoDirty: true });

watch(props, (cur) => {
  state.varroa = cur.modelValue;
});

watch(state, (cur) => {
  emit('update:modelValue', cur.varroa);
});

function openCalculator() {
  $q.dialog({
    component: DialogVarroa,
    componentProps: {
      value: state.varroa,
    },
  }).onOk((e) => {
    state.varroa = e;
  });
}
</script>
