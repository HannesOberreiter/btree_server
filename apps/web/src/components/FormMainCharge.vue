<script setup lang="ts">
import type { FormCharge } from '../types';
import useVuelidate from '@vuelidate/core';
import { toRefs } from '@vueuse/core';
import { flatten, map, merge } from 'lodash-es';
import { computed, ref, unref } from 'vue';
import { useApiFetch } from '../composables/useApi';
import { useDateFormat } from '../composables/useDate';
import { useNotification } from '../composables/useNotification';
import { useFieldsettingStore } from '../stores/fieldsetting';
import FormButtons from './FormButtons.vue';
import FormDropdownEdit from './FormDropdownEdit.vue';
import FormDropdownOption from './FormDropdownOption.vue';
import FormInputCheckboxString from './FormInputCheckboxString.vue';
import FormInputDate from './FormInputDate.vue';
import FormInputNote from './FormInputNote.vue';
import FormInputNumeric from './FormInputNumeric.vue';
import FormInputText from './FormInputText.vue';
import FormInputUrl from './FormInputUrl.vue';

const props = defineProps({
  ids: {
    type: Array,
    default: null
  },
  copy: {
    type: Boolean,
    default: false
  }
});
const emit = defineEmits<{
  (e: 'success', value: boolean): void;
}>();
const useDate = useDateFormat();
const fields = useFieldsettingStore();
const notification = useNotification();
const values = ref({});
const api = useApiFetch();
const reset = ref(0);
const { ids, copy } = toRefs(props);
const isEdit = computed(() => {
  if (copy.value) {
    return false;
  }
  if (ids.value === null) {
    return false;
  }
  if (ids.value.length === 0) {
    return false;
  }
  return true;
});

const isCopy = computed(() => {
  if (copy.value) {
    return true;
  }
  return false;
});

if (isEdit.value || isCopy.value) {
  getEdit(unref(ids.value));
}

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
  note: ''
};

const state = ref<FormCharge>({
  ...stateDefault,
  type: undefined as any,
  kind: 'in'
});

async function getEdit(id: unknown[]) {
  return await api.post('/v1/charge/batchGet', { ids: id }).then(
    (response: any) => {
      if (isEdit.value) {
        const editIds = map(response, (row: any) => [
          { value: row.id, label: `ID: ${row.id} / (${row.name})` }
        ]);
        editOptions.value = flatten(editIds);
        editOptionsCopy.value = flatten(editIds);
      }
      values.value = response;
    },
    error => {
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

<template>
  <q-form class="full-width" data-cy="form-charge" @submit.prevent.stop="">
    <FormDropdownEdit
      v-if="isEdit"
      v-model="editOptions"
      :options="editOptionsCopy"
      off-label="name"
    />
    <FormInputDate
      v-model="state.date"
      label="date"
      :values="values"
      :reset="reset"
    />
    <FormInputDate
      v-if="fields.settings.charge.bestbefore"
      v-model="state.bestbefore"
      label="bestbefore"
      :values="values"
      :reset="reset"
    />
    <FormInputText
      v-model="state.name"
      label="description"
      name="chargeName"
      table-id="name"
      icon="fas fa-passport"
      :required="false"
      :values="values"
      :reset="reset"
    />
    <FormDropdownOption
      v-model="state.type"
      table="charge_types"
      label="type"
      :values="values"
      :reset="reset"
    />
    <FormInputText
      v-model="state.charge"
      label="charge"
      name="chargeNumber"
      icon="fas fa-receipt"
      :values="values"
      :reset="reset"
    />
    <FormInputNumeric
      v-model="state.amount"
      :values="values"
      :reset="reset"
      :shadow-text="
        !state.type ? '' : state.type.unit ? ` ${state.type.unit}` : ''
      "
      label="amount"
      icon="fas fa-database"
      numeric-valid="decimal"
      :max-valid="100000"
    />
    <FormInputNumeric
      v-if="fields.settings.charge.price"
      v-model="state.price"
      :values="values"
      :reset="reset"
      label="price"
      icon="far fa-money-bill-1"
      numeric-valid="decimal"
      :max-valid="100000"
    />

    <FormInputUrl v-model="state.url" :values="values" :reset="reset" />
    <FormInputNote v-model="state.note" :values="values" :reset="reset" />
    <FormInputCheckboxString
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
    />
  </q-form>
  <FormButtons
    class="q-pt-md"
    :state="state"
    :is-edit="isEdit"
    :edit-ids="editOptions"
    :v="v"
    form="charge"
    @reset="onReset"
    @change="emit('success', true)"
  />
</template>
