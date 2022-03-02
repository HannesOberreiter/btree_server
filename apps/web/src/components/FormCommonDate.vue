<template>
  <q-input
    v-model="v.date.$model"
    :error="v.date.$error"
    :error-messages="validationErrors(v.date)"
    mask="####-##-##"
    filled
  >
    <template v-slot:append>
      <q-icon name="fas fa-calendar" class="cursor-pointer">
        <q-popup-proxy
          ref="qDateProxy"
          cover
          transition-show="scale"
          transition-hide="scale"
        >
          <q-date v-model="v.date.$model" mask="YYYY-MM-DD">
            <div class="row items-center justify-end">
              <q-btn v-close-popup :label="t('close')" color="primary" flat />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { required } from '../helpers/i18n-validators';
import { reactive, watch } from 'vue';
import { validationErrors } from '../helpers';
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat); // Needed to validate if date is even possible

const { t } = useI18n();
const props = defineProps({
  modelValue: {
    type: String,
    default: dayjs().format('YYYY-MM-DD'),
  },
});

watch(props, (cur) => {
  state.date = cur.modelValue;
});

const state = reactive({
  date: props.modelValue,
});
const rules = {
  date: {
    required,
    minValue: (value: string) => {
      return dayjs(value, 'YYYY-MM-DD', true).isValid();
    },
  },
};

const v = useVuelidate(rules, state);
</script>
