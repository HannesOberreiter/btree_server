<template>
  <q-input
    v-model="modelValue"
    :error="v[props.label]['$error']"
    :error-messages="validationErrors(v[props.label])"
    :label="disable ? $t('multipleValues') : $t(label)"
    input-class="text-center"
    type="text"
    :disable="disable"
    readonly
    filled
    no-error-icon
    @click="qDateProxy = !qDateProxy"
  >
    <template #before>
      <btn-multiple-values
        v-if="multipleValues"
        :disable="disable"
        @click="editValues(!disable)"
      ></btn-multiple-values>
      <q-icon :name="icon" class="cursor-pointer">
        <q-popup-proxy
          v-model="qDateProxy"
          transition-show="scale"
          transition-hide="scale"
        >
          <div class="row">
            <q-date
              v-model="modelValue"
              :events="markDate"
              :mask="dateFormat"
              :disable="disable"
              today-btn
              no-unset
              @update:model-value="() => (qDateProxy = !autoClose)"
            >
              <div class="row items-center justify-end">
                <btn-date-auto-close
                  @change="(v: boolean) => autoClose = v"
                ></btn-date-auto-close>
                <btn-base
                  v-close-popup
                  :label="$t('close')"
                  color="primary"
                  flat
                />
              </div>
            </q-date>
            <q-time
              v-if="
                dateFormat === 'YYYY-MM-DD HH:mm:ss' ||
                dateFormat === 'YYYY-MM-DD HH:mm'
              "
              v-model="modelValue"
              :mask="dateFormat"
              :with-seconds="
                dateFormat === 'YYYY-MM-DD HH:mm:ss' ? true : false
              "
              :format24h="true"
              color="purple"
            >
            </q-time>
          </div>
        </q-popup-proxy>
      </q-icon>
    </template>
    <template #after><slot name="deepAfter"></slot></template>
  </q-input>
</template>

<script setup lang="ts">
import { requiredField } from '~/helpers/i18n-validators';
import { useVModels } from '@vueuse/core';
import { formCheckMultipleValues, validationErrors } from '~/helpers';
import dayjs from 'dayjs';
import useVuelidate from '@vuelidate/core';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { isEmpty } from 'lodash-es';
import { useI18n } from 'vue-i18n';

import BtnDateAutoClose from './BtnDateAutoClose.vue';
import { ref, computed, toRefs, unref, watch } from 'vue';

dayjs.extend(customParseFormat); // Needed to validate if date is even possible
const { t } = useI18n();
const qDateProxy = ref(false);
const autoClose = ref(false);

const props = defineProps({
  dateFormat: {
    type: String,
    default: 'YYYY-MM-DD',
  },
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
  tableId: {
    default: null,
  },
  reset: {
    type: Number,
    default: 0,
  },
  values: {
    type: Object,
    default: null,
  },
  icon: {
    type: String,
    default: 'fas fa-calendar',
  },
  required: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);
const resetValue = unref(modelValue.value);
const { values, reset } = toRefs(props);
const multipleValues = computed(() =>
  formCheckMultipleValues(
    values.value,
    props.tableId ? props.tableId : props.label
  )
);
const disable = ref(multipleValues.value);

const state = {
  [props.label]: modelValue,
};

const rules = computed(() => {
  if (props.required) {
    return {
      [props.label]: {
        required: requiredField(t(props.label)),
        minValue: (value: string) => {
          return dayjs(value, props.dateFormat, true).isValid();
        },
      },
    };
  } else {
    return {
      [props.label]: {
        minValue: (value: string) => {
          return !value || dayjs(value, props.dateFormat, true).isValid();
        },
      },
    };
  }
});

const v = useVuelidate(rules, state, { $autoDirty: true });

watch([reset, values], () => {
  setValues();
});

function setValues() {
  disable.value = multipleValues.value;

  if (multipleValues.value) editValues(true);
  else if (values.value && !isEmpty(values.value)) {
    modelValue.value = dayjs(
      values.value[0][props.tableId ? props.tableId : props.label]
    ).format(props.dateFormat);
  } else modelValue.value = resetValue;
}

function editValues(val: boolean) {
  disable.value = val;
  modelValue.value = disable.value ? null : modelValue.value;
}
function markDate(date: string) {
  return dayjs(date).isSame(props.mark);
}
</script>
