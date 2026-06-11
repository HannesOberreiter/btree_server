<script setup lang="ts">
import type { PropType } from 'vue';
import useVuelidate from '@vuelidate/core';
import { useVModels } from '@vueuse/core';
import { isEmpty } from 'lodash-es';
import { computed, ref, toRefs, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDateFormat } from '../composables/useDate';
import { formCheckMultipleValues, validationErrors } from '../helpers';

import { requiredField } from '../helpers/i18n-validators';
import BtnBase from './BtnBase.vue';
import BtnMultipleValues from './BtnMultipleValues.vue';

const props = defineProps({
  label: {
    default: 'time'
  },
  modelValue: {
    type: null as unknown as PropType<string | null>,
    validator: (v: any) => typeof v === 'string' || v === null,
    required: true
  },
  reset: {
    type: Number,
    default: 0
  },
  values: {
    type: Object,
    default: null
  },
  required: {
    type: Boolean,
    default: false
  }
});
const emit = defineEmits(['update:modelValue']);
const qDateProxy = ref(false);
const useDate = useDateFormat();
const { t } = useI18n();
const { modelValue } = useVModels(props, emit);
const resetValue = unref(modelValue.value);
const { values, reset } = toRefs(props);
const multipleValues = computed(() =>
  formCheckMultipleValues(values.value, 'time')
);
const disable = ref(multipleValues.value);
modelValue.value = disable.value ? null : modelValue.value;
const state = {
  time: modelValue
};

const rules = computed(() => {
  if (props.required) {
    return {
      [props.label]: {
        required: requiredField(t(props.label)),
        minValue: (value: string) => {
          return useDate.validateFormat(value, 'HH:mm');
        }
      }
    };
  } else {
    return {
      [props.label]: {
        minValue: (value: string) => {
          return !value || useDate.validateFormat(value, 'HH:mm');
        }
      }
    };
  }
});

const v = useVuelidate(rules, state, { $autoDirty: true });

watch(values, () => {
  setValues();
});

watch(reset, () => {
  setValues();
});

function setValues() {
  disable.value = multipleValues.value;
  if (multipleValues.value) {
    editValues(true);
  } else if (values.value && !isEmpty(values.value)) {
    if (values.value[0].time) {
      modelValue.value = useDate.isoFormat(
        values.value[0].time,
        'time',
        'HH:mm:ss'
      );
    } else {
      modelValue.value = null;
    }
  } else {
    modelValue.value = resetValue;
  }
}

function editValues(val: boolean) {
  disable.value = val;
  modelValue.value = disable.value
    ? null
    : useDate.isoFormat(useDate.getCurrent(), 'time');
}
</script>

<template>
  <q-input
    v-model="modelValue"
    filled
    :label="disable ? `${$t('time')} - ${$t('multipleValues')}` : $t('time')"
    name="time"
    type="time"
    :disable="disable"
    :error="v.time.$error"
    :error-message="validationErrors(v.time)"
    :no-error-icon="true"
    readonly
    @click="qDateProxy = !qDateProxy"
  >
    <template #before>
      <BtnMultipleValues
        v-if="multipleValues"
        :disable="disable"
        @click="editValues(!disable)"
      />
      <q-icon
        v-if="!disable"
        name="fas fa-clock"
        class="cursor-pointer"
        :class="disable ? '' : 'q-pl-xs'"
      >
        <q-popup-proxy
          v-model="qDateProxy"
          cover
          transition-show="scale"
          transition-hide="scale"
        >
          <q-time v-model="modelValue" mask="HH:mm" format24h>
            <div class="row items-center justify-end">
              <BtnBase
                v-close-popup
                :label="$t('close')"
                color="primary"
                flat
              />
            </div>
          </q-time>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>
