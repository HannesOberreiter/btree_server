<template>
  <q-form class="full-width" @submit.prevent.stop="">
    <form-dropdown-edit
      v-if="isEdit"
      v-model="editOptions"
      :options="editOptionsCopy"
      off-label="name"
    ></form-dropdown-edit>
    <form-input-date
      v-model="state.date"
      label="date"
      :values="values"
      :reset="reset"
    ></form-input-date>
    <form-input-date
      v-if="fields.settings.charge.bestbefore"
      v-model="state.bestbefore"
      label="bestbefore"
      :values="values"
      :reset="reset"
    ></form-input-date>
    <form-input-text
      v-model="state.name"
      label="name"
      icon="fas fa-passport"
      :required="isEdit ? false : true"
      :values="values"
      :reset="reset"
    ></form-input-text>
    <form-dropdown-option
      v-model="state.type"
      table="charge_types"
      label="type"
      :values="values"
      :reset="reset"
    ></form-dropdown-option>
    <form-input-text
      v-model="state.charge"
      label="chargeNumber"
      icon="fas fa-receipt"
      :values="values"
      :reset="reset"
    ></form-input-text>
    <form-input-numeric
      v-model="state.amount"
      :values="values"
      :reset="reset"
      :shadow-text="
        !state.type ? '' : state.type.unit ? ' ' + state.type.unit : ''
      "
      label="amount"
      icon="fas fa-database"
      numeric-valid="decimal"
      :max-valid="100000"
    ></form-input-numeric>
    <form-input-numeric
      v-if="fields.settings.charge.price"
      v-model="state.price"
      :values="values"
      :reset="reset"
      label="price"
      icon="far fa-money-bill-1"
      numeric-valid="decimal"
      :max-valid="100000"
    ></form-input-numeric>
    <form-input-checkbox-string
      v-model="state.kind"
      label="kind"
      icon="fas fa-passport"
      :values="values"
      :reset="reset"
      :required="true"
      status-active="in"
      status-inactive="out"
      true-value="in"
      false-value="out"
    ></form-input-checkbox-string>

    <form-input-url
      v-model="state.url"
      :values="values"
      :reset="reset"
    ></form-input-url>
    <form-input-note
      v-model="state.note"
      :values="values"
      :reset="reset"
    ></form-input-note>
  </q-form>
  <form-buttons
    class="q-pt-md"
    :state="state"
    :is-edit="isEdit"
    :edit-ids="editOptions"
    :v="v"
    form="charge"
    @reset="onReset"
    @change="emit('onSuccess', true)"
  >
  </form-buttons>
</template>

<script setup lang="ts">
import { useNotification } from '~/composables/useResponseText';
import useVuelidate from '@vuelidate/core';
import { flatten, map, merge } from 'lodash-es';
import { FormCharge } from '~/types';
import { useApiFetch } from '~/composables/useApi';
import { useDateFormat } from '~/composables/useDate';
import { useFieldsettingStore } from '~/stores/fieldsetting';

const useDate = useDateFormat();
const fields = useFieldsettingStore();
const notification = useNotification();
const values = ref({});
const api = useApiFetch();
const reset = ref(0);
const props = defineProps({
  ids: {
    type: Array,
    default: null,
  },
});
const emit = defineEmits<{
  (e: 'onSuccess', value: boolean): void;
}>();

const ids = ref(props.ids);
const isEdit = computed(() => {
  if (ids.value === null) return false;
  if (ids.value.length === 0) return false;
  return true;
});
if (isEdit.value) getEdit(unref(ids.value));

const v = useVuelidate();

const editOptions = ref([]) as any;
const editOptionsCopy = ref([]) as any;

const stateDefault = {
  date: useDate.isoFormat(useDate.getCurrent(), 'date'),
  bestbefore: useDate.isoFormat(useDate.getCurrent(), 'date'),
  name: '',
  charge: '',
  amount: 0,
  price: 0,
  url: '',
  note: '',
};

const state = ref<FormCharge>({
  ...stateDefault,
  type: undefined as any,
  kind: 'in',
});

async function getEdit(id: unknown[]) {
  return await api.post('/v1/charge/batchGet', { ids: id }).then(
    (response: any) => {
      const editIds = map(response, (row: any) => [
        { value: row.id, label: `ID: ${row.id} / (${row.name})` },
      ]);
      editOptions.value = flatten(editIds);
      editOptionsCopy.value = flatten(editIds);
      values.value = response;
    },
    (error) => {
      notification.open('negative', error);
    }
  );
}

function onReset() {
  if (!isEdit.value) {
    merge(state.value, stateDefault);
  }
  notification.open('positive', 'successReset');
  reset.value++;
}
</script>
