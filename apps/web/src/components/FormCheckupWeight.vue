<template>
  <div class="row">
    <div class="col-12 col-md-6">
      <q-input
        v-model.number="modelValue"
        :error="v.weight.$error"
        :error-message="validationErrors(v.weight)"
        :no-error-icon="true"
        :label="t('weight')"
        :disable="modelMultiple"
        name="weight"
        type="number"
        filled
      >
        <template #before>
          <q-icon v-if="!modelMultiple" name="fas fa-weight"></q-icon>
          <btn-multiple-values
            v-else
            @click="modelMultiple = !modelMultiple"
          ></btn-multiple-values>
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
    </div>
    <div class="col-12 col-md-6">
      <q-input
        v-model="modelTime"
        filled
        :label="t('time')"
        name="time"
        type="time"
        :disable="modelMultipleTime"
        :error="v.weight.$error"
        :error-message="validationErrors(v.time)"
        :no-error-icon="true"
        readonly
        @click="qDateProxy = !qDateProxy"
      >
        <template #before>
          <q-icon
            v-if="!modelMultipleTime"
            name="fas fa-clock"
            class="cursor-pointer"
          >
            <q-popup-proxy
              v-model="qDateProxy"
              cover
              transition-show="scale"
              transition-hide="scale"
            >
              <q-time v-model="modelTime" mask="HH:mm" format24h>
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
          <btn-multiple-values
            v-else
            @click="modelMultipleTime = !modelMultipleTime"
          ></btn-multiple-values>
        </template>
      </q-input>
    </div>
  </div>
</template>

<script setup lang="ts">
import { minValue, maxValue, numeric } from '~/helpers/i18n-validators';
import { useI18n } from 'vue-i18n';
import { useVModels } from '@vueuse/core';
import { validationErrors } from '~/helpers';
import dayjs from 'dayjs';
import useVuelidate from '@vuelidate/core';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import BtnMultipleValues from './BtnMultipleValues.vue';
import { ref } from 'vue';
dayjs.extend(customParseFormat); // Needed to validate if date is even possible

const { t } = useI18n();
const qDateProxy = ref(false);

const props = defineProps({
  modelValue: {
    default: 0,
  },
  modelTime: {
    default: dayjs().format('HH:mm'),
  },
  modelMultiple: {
    default: false,
  },
  modelMultipleTime: {
    default: false,
  },
});
const emit = defineEmits([
  'update:modelValue',
  'update:modelTime',
  'update:modelMultiple',
  'update:modelMultipleTime',
]);
const { modelValue, modelTime, modelMultiple, modelMultipleTime } = useVModels(
  props,
  emit
);

const state = {
  weight: modelValue,
  time: modelTime,
};
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
</script>
