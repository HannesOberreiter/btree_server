<template>
  <q-form class="full-width" data-cy="form-option" @submit.prevent.stop="">
    <form-dropdown-edit
      v-if="isEdit"
      v-model="editOptions"
      :options="editOptionsCopy"
      off-label="name"
    ></form-dropdown-edit>
    <form-input-text
      v-model="state.name"
      label="name"
      :name="option"
      icon="fas fa-passport"
      :values="values"
      :reset="reset"
      :required="isEdit ? false : true"
      :max-valid="45"
    ></form-input-text>
    <form-input-text
      v-if="option === 'charge_types'"
      v-model="state.unit"
      label="unit"
      icon="fas fa-wine-bottle"
      :values="values"
      :reset="reset"
      :required="isEdit ? false : true"
      :max-valid="45"
    ></form-input-text>
    <form-input-note
      v-if="option === 'treatment_vets'"
      v-model="state.note"
      :values="values"
      :reset="reset"
    ></form-input-note>
    <form-input-checkbox
      v-model="state.modus"
      label="active"
      :values="values"
      :reset="reset"
      status-active="yes"
      status-inactive="no"
    ></form-input-checkbox>
    <form-input-checkbox
      v-model="state.favorite"
      label="favorite"
      :values="values"
      :reset="reset"
      status-active="yes"
      status-inactive="no"
    ></form-input-checkbox>
  </q-form>
  <form-buttons
    class="q-pt-md"
    :state="state"
    :is-edit="isEdit"
    :edit-ids="editOptions"
    :v="v"
    form="option"
    :form-option="props.option"
    @reset="onReset"
    @change="emit('onSuccess', true)"
  >
  </form-buttons>
</template>

<script setup lang="ts">
import { useNotification } from '../composables/useNotification';
import useVuelidate from '@vuelidate/core';
import { flatten, map, merge } from 'lodash-es';
import type { FormOption, Option } from '../types';
import { useApiFetch } from '../composables/useApi';
import FormButtons from './FormButtons.vue';
import type { PropType } from 'vue';
import { ref, computed, unref } from 'vue';
import FormInputCheckbox from './FormInputCheckbox.vue';
import FormInputNote from './FormInputNote.vue';
import FormInputText from './FormInputText.vue';
import FormDropdownEdit from './FormDropdownEdit.vue';

const notification = useNotification();
const values = ref({});
const api = useApiFetch();
const reset = ref(0);
const props = defineProps({
  ids: {
    type: Array,
    default: null,
  },
  option: {
    type: String as PropType<Option>,
    default: '',
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
  name: '',
  unit: null as any,
  note: null as any,
  modus: true,
  favorite: false,
};

const state = ref<FormOption>({
  ...stateDefault,
});

async function getEdit(id: unknown[]) {
  return await api
    .post(`/v1/option/${props.option}/batchGet`, { ids: id })
    .then(
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
      },
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
