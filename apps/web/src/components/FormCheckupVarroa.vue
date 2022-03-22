<template>
  <q-input
    v-model.number="modelValue"
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
        @click="modelValue++"
      ></q-btn>
      <q-btn
        round
        flat
        dense
        icon="fas fa-minus"
        style="cursor: pointer"
        :disable="modelValue <= 0"
        @click="modelValue--"
      ></q-btn>
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { minValue, maxValue, numeric } from '~/helpers/i18n-validators';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useVModels } from '@vueuse/core';
import { validationErrors } from '~/helpers';
import DialogVarroa from './DialogVarroa.vue';
import useVuelidate from '@vuelidate/core';

const { t } = useI18n();
const $q = useQuasar();
const props = defineProps({
  modelValue: {
    default: 0,
  },
});
const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);

const state = {
  varroa: modelValue,
};
const rules = {
  varroa: { minValue: minValue(0), maxValue: maxValue(100), numeric: numeric },
};
const v = useVuelidate(rules, state, { $autoDirty: true });

function openCalculator() {
  $q.dialog({
    component: DialogVarroa,
    componentProps: {
      value: modelValue.value,
    },
  }).onOk((e) => {
    modelValue.value = e;
  });
}
</script>
