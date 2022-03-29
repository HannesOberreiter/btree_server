<template>
  <q-input
    v-model="modelValue"
    :error="v.note.$error"
    :error-message="validationErrors(v.note)"
    :no-error-icon="true"
    :label="disable ? $t('multipleValues') : $t('note')"
    :disable="disable"
    name="note"
    type="textarea"
    filled
  >
    <template v-if="multipleValues" #before>
      <btn-multiple-values
        :disable="disable"
        @click="editValues(!disable)"
      ></btn-multiple-values>
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { maxLength } from '~/helpers/i18n-validators';
import { formCheckMultipleValues, validationErrors } from '~/helpers';
import useVuelidate from '@vuelidate/core';
import { useVModels } from '@vueuse/core';
import BtnMultipleValues from './BtnMultipleValues.vue';
import { computed, ref, toRefs, unref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    default: '',
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
  formCheckMultipleValues(values.value, 'note')
);
const disable = ref(multipleValues.value);
modelValue.value = disable.value ? null : modelValue.value;
const state = {
  note: modelValue,
};
const rules = {
  note: { maxLengthValue: maxLength(2000) },
};
const v = useVuelidate(rules, state, { $autoDirty: true });

watch(multipleValues, () => {
  editValues(multipleValues.value);
});

watch(reset, () => {
  if (multipleValues.value) editValues(true);
  else if (values.value) modelValue.value = values.value[0].note;
  else modelValue.value = resetValue;
});

function editValues(val: boolean) {
  disable.value = val;
  modelValue.value = disable.value ? null : modelValue.value;
}
</script>
