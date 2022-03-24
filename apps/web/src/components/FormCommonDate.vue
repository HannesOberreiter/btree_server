<template>
  <q-input
    v-model="modelValue"
    :error="v.date.$error"
    :error-messages="validationErrors(v.date)"
    :label="t(label)"
    input-class="text-center"
    type="date"
    :disable="disable"
    readonly
    filled
    no-error-icon
    @click="qDateProxy = !qDateProxy"
  >
    <template #append>
      <q-icon name="fas fa-calendar" class="cursor-pointer">
        <q-popup-proxy
          v-model="qDateProxy"
          cover
          transition-show="scale"
          transition-hide="scale"
        >
          <q-date
            v-model="modelValue"
            :events="markDate"
            mask="YYYY-MM-DD"
            today-btn
          >
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
import { ref } from 'vue';
import { required } from '~/helpers/i18n-validators';
import { useI18n } from 'vue-i18n';
import { useVModels } from '@vueuse/core';
import { validationErrors } from '~/helpers';
import dayjs from 'dayjs';
import useVuelidate from '@vuelidate/core';

import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat); // Needed to validate if date is even possible

const { t } = useI18n();
const qDateProxy = ref(false);
const props = defineProps({
  modelValue: {
    default: dayjs().format('YYYY-MM-DD'),
  },
  mark: {
    default: dayjs().format('YYYY-MM-DD'),
  },
  label: {
    type: String,
    default: 'date',
  },
  disable: {
    default: false,
  },
});
const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);

const state = {
  date: modelValue,
};

const rules = {
  date: {
    required,
    minValue: (value: string) => {
      return dayjs(value, 'YYYY-MM-DD', true).isValid();
    },
  },
};

const v = useVuelidate(rules, state, { $autoDirty: true });

function markDate(date: string) {
  return dayjs(date).isSame(props.mark);
}
</script>
