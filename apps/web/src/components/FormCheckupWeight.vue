<template>
  <div class="row">
    <div class="col-12 col-md-6">
      <q-input
        v-model="state.weight"
        :error="v.weight.$error"
        :error-message="validationErrors(v.weight)"
        :no-error-icon="true"
        :label="t('weight')"
        name="weight"
        type="number"
        filled
      >
        <template v-slot:before>
          <q-icon name="fas fa-weight"></q-icon>
        </template>
        <template v-slot:append>
          <q-btn
            round
            flat
            dense
            icon="fas fa-plus"
            style="cursor: pointer"
            @click="state.weight++"
          ></q-btn>
          <q-btn
            round
            flat
            dense
            icon="fas fa-minus"
            style="cursor: pointer"
            :disable="state.weight <= 0"
            @click="state.weight--"
          ></q-btn>
        </template>
      </q-input>
    </div>
    <div class="col-12 col-md-6">
      <q-input
        filled
        v-model="state.time"
        :label="t('time')"
        name="time"
        type="time"
        :error="v.weight.$error"
        :error-message="validationErrors(v.time)"
        :no-error-icon="true"
        readonly
      >
        <template v-slot:append>
          <q-icon name="fas fa-clock" class="cursor-pointer">
            <q-popup-proxy
              cover
              transition-show="scale"
              transition-hide="scale"
            >
              <q-time v-model="state.time" mask="HH:mm" format24h>
                <div class="row items-center justify-end">
                  <q-btn
                    v-close-popup
                    :label="t('close')"
                    color="primary"
                    flat
                  />
                </div>
              </q-time>
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
    </div>
  </div>
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { minValue, maxValue, numeric } from '../helpers/i18n-validators';
import { reactive, watch } from 'vue';
import { validationErrors } from '../helpers';
import { useI18n } from 'vue-i18n';
import { useVModels } from '@vueuse/core';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat); // Needed to validate if date is even possible

const { t } = useI18n();
const props = defineProps({
  modelValue: {
    default: 0,
  },
  modelTime: {
    default: dayjs().format('HH:mm'),
  },
});
const emit = defineEmits(['update:modelValue', 'update:modelTime']);
const { modelValue, modelTime } = useVModels(props, emit);

const state = reactive({
  weight: modelValue.value,
  time: modelTime.value,
});
const rules = {
  weight: {
    minValue: minValue(0),
    maxValue: maxValue(100),
    numeric: numeric,
  },
  time: {
    minValue: (value: string) => {
      return dayjs(value, 'HH:mm', true).isValid();
    },
  },
};
const v = useVuelidate(rules, state, { $autoDirty: true });

watch(props, (cur) => {
  state.weight = cur.modelValue;
  state.time = cur.modelTime;
});

watch(state, (cur) => {
  emit('update:modelValue', cur.weight);
  emit('update:modelTime', cur.time);
});
</script>
