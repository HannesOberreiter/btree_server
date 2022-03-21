<template>
  <q-input
    v-model="state.date"
    :error="v.date.$error"
    :error-messages="validationErrors(v.date)"
    :label="t(label)"
    input-class="text-center"
    type="date"
    readonly
    filled
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
            v-model="state.date"
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
import useVuelidate from '@vuelidate/core';
import { required } from '../helpers/i18n-validators';
import { reactive, ref, watch } from 'vue';
import { validationErrors } from '../helpers';
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useVModels } from '@vueuse/core';
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
});
const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);

watch(props, (cur) => {
  state.date = cur.modelValue;
});

const state = reactive({
  date: modelValue.value,
});

watch(state, (cur) => {
  emit('update:modelValue', cur.date);
});

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
