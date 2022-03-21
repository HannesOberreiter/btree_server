<template>
  <q-input
    v-model="state.strong"
    :error="v.strong.$error"
    :error-message="validationErrors(v.strong)"
    :no-error-icon="true"
    :label="t('strong')"
    name="strong"
    type="number"
    filled
  >
    <template #before>
      <q-icon name="fas fa-dumbbell"></q-icon>
    </template>
    <template #append>
      <q-btn
        round
        flat
        dense
        icon="fas fa-plus"
        style="cursor: pointer"
        @click="state.strong++"
      ></q-btn>
      <q-btn
        round
        flat
        dense
        icon="fas fa-minus"
        style="cursor: pointer"
        :disable="state.strong <= 0"
        @click="state.strong--"
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
  strong: modelValue.value,
});
const rules = {
  strong: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    numeric: numeric,
  },
};
const v = useVuelidate(rules, state, { $autoDirty: true });

watch(props, (cur) => {
  state.strong = cur.modelValue;
});

watch(state, (cur) => {
  emit('update:modelValue', cur.strong);
});
</script>
