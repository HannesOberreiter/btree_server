<template>
  <q-input
    v-model="modelValue"
    :error="v.date.$error"
    :error-messages="validationErrors(v.date)"
    :label="disable ? $t('multipleValues') : $t(label)"
    input-class="text-center"
    type="date"
    :disable="disable"
    readonly
    filled
    no-error-icon
    @click="qDateProxy = !qDateProxy"
  >
    <template #before>
      <q-icon
        v-if="!multipleValues"
        name="fas fa-calendar"
        class="cursor-pointer"
      >
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
      <btn-multiple-values
        v-else
        :disable="disable"
        @click="editValues(!disable)"
      ></btn-multiple-values>
    </template>
    <template #after><slot name="deepAfter"></slot></template>
  </q-input>
</template>

<script setup lang="ts">
import { computed, ref, toRefs, unref, watch } from 'vue';
import { required } from '~/helpers/i18n-validators';
import { useI18n } from 'vue-i18n';
import { useVModels } from '@vueuse/core';
import { formCheckMultipleValues, validationErrors } from '~/helpers';
import dayjs from 'dayjs';
import useVuelidate from '@vuelidate/core';
import BtnMultipleValues from '~/components/BtnMultipleValues.vue';

import customParseFormat from 'dayjs/plugin/customParseFormat';
import { isEmpty } from 'lodash';
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
  reset: {
    type: Number,
    default: 0,
  },
  values: {
    type: Object,
    default: null,
  },
});
const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);
const resetValue = unref(modelValue.value);
const { values, reset } = toRefs(props);
const multipleValues = computed(() =>
  formCheckMultipleValues(values.value, props.label)
);
const disable = ref(multipleValues.value);
modelValue.value = disable.value ? null : modelValue.value;

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

watch(multipleValues, () => {
  editValues(multipleValues.value);
});

watch(reset, () => {
  if (multipleValues.value) editValues(true);
  else if (values.value && !isEmpty(values.value)) {
    console.log(values.value[0][props.label]);
    modelValue.value = dayjs(values.value[0][props.label]).format('YYYY-MM-DD');
  } else modelValue.value = resetValue;
});

function editValues(val: boolean) {
  disable.value = val;
  modelValue.value = disable.value ? null : modelValue.value;
}
function markDate(date: string) {
  return dayjs(date).isSame(props.mark);
}
</script>
