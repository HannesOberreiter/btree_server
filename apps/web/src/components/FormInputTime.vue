<template>
  <q-input
    v-model="modelValue"
    filled
    :label="disable ? $t('time') + ' - ' + $t('multipleValues') : $t('time')"
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
      <btn-multiple-values
        v-if="multipleValues"
        :disable="disable"
        @click="editValues(!disable)"
      ></btn-multiple-values>
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
              <btn-base
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

<script setup lang="ts">
import { useVModels } from '@vueuse/core';
import { formCheckMultipleValues, validationErrors } from '~/helpers';
import useVuelidate from '@vuelidate/core';
import { PropType } from 'vue';
import { isEmpty } from 'lodash-es';
import { useDateFormat } from '~/composables/useDate';

const qDateProxy = ref(false);
const useDate = useDateFormat();
const props = defineProps({
  modelValue: {
    type: null as unknown as PropType<string | null>,
    validator: (v: any) => typeof v === 'string' || v === null,
    required: true,
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
  formCheckMultipleValues(values.value, 'time')
);
const disable = ref(multipleValues.value);
modelValue.value = disable.value ? null : modelValue.value;
const state = {
  time: modelValue,
};
const rules = {
  time: {
    minValue: (value: string) => {
      if (value === null) return true;
      return useDate.validateFormat(value, 'HH:mm');
    },
  },
};
const v = useVuelidate(rules, state, { $autoDirty: true });

watch(values, () => {
  setValues();
});

watch(reset, () => {
  setValues();
});

function setValues() {
  disable.value = multipleValues.value;
  if (multipleValues.value) editValues(true);
  else if (values.value && !isEmpty(values.value))
    modelValue.value = useDate.isoFormat(
      values.value[0].time,
      'time',
      'HH:mm:ss'
    );
  else modelValue.value = resetValue;
}

function editValues(val: boolean) {
  disable.value = val;
  modelValue.value = disable.value
    ? null
    : useDate.isoFormat(useDate.getCurrent(), 'time');
}
</script>
