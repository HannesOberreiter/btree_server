<template>
  <q-input
    v-model="state.wait"
    :error="v.wait.$error"
    :error-message="validationErrors(v.wait)"
    :no-error-icon="true"
    :label="t('waitTime')"
    :shadow-text="t('day', 2)"
    name="wait"
    type="number"
    filled
  >
    <template #before>
      <q-icon name="fas fa-circle-pause"></q-icon>
    </template>
    <template #append>
      <q-btn
        round
        flat
        dense
        icon="fas fa-plus"
        style="cursor: pointer"
        @click="state.wait++"
      ></q-btn>
      <q-btn
        round
        flat
        dense
        icon="fas fa-minus"
        style="cursor: pointer"
        :disable="state.wait <= 0"
        @click="state.wait--"
      ></q-btn>
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { minValue, maxValue, integer } from '~/helpers/i18n-validators';
import { reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useVModels } from '@vueuse/core';
import { validationErrors } from '~/helpers';
import useVuelidate from '@vuelidate/core';

const { t } = useI18n();
const props = defineProps({
  modelValue: {
    type: Number,
    default: 0,
  },
});
const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);

const state = reactive({
  wait: modelValue.value,
});
const rules = {
  wait: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    numeric: integer,
  },
};
const v = useVuelidate(rules, state, { $autoDirty: true });

watch(props, (cur) => {
  state.wait = cur.modelValue;
});

watch(state, (cur) => {
  emit('update:modelValue', cur.wait);
});
</script>
