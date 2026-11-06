<script setup lang="ts">
import type { PropType } from 'vue';
import type { OptionResponse, RecipeTable } from '../api/types';
import type { FormOption, Option } from '../types';
import useVuelidate from '@vuelidate/core';
import { flatten, map, merge } from 'lodash-es';
import { computed, ref, unref } from 'vue';
import { useApiFetch } from '../composables/useApi';
import { useNotification } from '../composables/useNotification';
import FormButtons from './FormButtons.vue';
import FormDropdownEdit from './FormDropdownEdit.vue';
import FormInputCheckbox from './FormInputCheckbox.vue';
import FormInputNote from './FormInputNote.vue';
import FormInputText from './FormInputText.vue';
import FormStockRecipe from './FormStockRecipe.vue';

const props = defineProps({
  ids: {
    type: Array,
    default: null
  },
  option: {
    type: String as PropType<Option>,
    default: ''
  }
});
const emit = defineEmits<{
  (e: 'success', value: boolean): void;
}>();
const notification = useNotification();
const values = ref<OptionResponse[]>([]);
const api = useApiFetch();
const reset = ref(0);
const ids = ref(props.ids);
const isEdit = computed(() => {
  if (ids.value === null) {
    return false;
  }
  if (ids.value.length === 0) {
    return false;
  }
  return true;
});
if (isEdit.value) {
  getEdit(unref(ids.value));
}

const v = useVuelidate();

const UNIT_TABLES: Option[] = [
  'charge_types',
  'feed_types',
  'treatment_types',
  'harvest_types'
];
const RECIPE_TABLES: Option[] = [
  'feed_types',
  'treatment_types',
  'harvest_types',
  'checkup_types'
];
// One type at a time: a new one or a single edited one.
const recipeType = computed(() => (isEdit.value ? values.value[0] : null));
const showRecipe = computed(
  () =>
    RECIPE_TABLES.includes(props.option) &&
    (!isEdit.value || values.value.length === 1)
);
const recipeForm = ref<InstanceType<typeof FormStockRecipe> | null>(null);

// The recipe is saved with the type, so it needs the id of the saved type.
async function onChange(_type: string, response: unknown) {
  const created = response as Partial<OptionResponse> | null;
  const typeId = recipeType.value?.id ?? created?.id;
  if (recipeForm.value && typeId) {
    await recipeForm.value.save(typeId);
  }
  emit('success', true);
}

const editOptions = ref([]) as any;
const editOptionsCopy = ref([]) as any;

const stateDefault = {
  name: '',
  unit: null as any,
  note: null as any,
  modus: true,
  favorite: false
};

const state = ref<FormOption>({
  ...stateDefault
});

async function getEdit(id: unknown[]) {
  return await api
    .post(`/v1/option/${props.option}/batchGet`, { ids: id })
    .then(
      (response: any) => {
        const editIds = map(response, (row: any) => [
          { value: row.id, label: `ID: ${row.id} / (${row.name})` }
        ]);
        editOptions.value = flatten(editIds);
        editOptionsCopy.value = flatten(editIds);
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
  <q-form class="full-width" data-cy="form-option" @submit.prevent.stop="">
    <FormDropdownEdit
      v-if="isEdit"
      v-model="editOptions"
      :options="editOptionsCopy"
      off-label="name"
    />
    <FormInputText
      v-model="state.name"
      label="name"
      :name="option"
      icon="fas fa-passport"
      :values="values"
      :reset="reset"
      :required="isEdit ? false : true"
      :max-valid="45"
    />
    <FormInputText
      v-if="UNIT_TABLES.includes(option)"
      v-model="state.unit"
      label="unit"
      icon="fas fa-wine-bottle"
      :values="values"
      :reset="reset"
      :required="option === 'charge_types' && !isEdit"
      :max-valid="45"
    />
    <FormInputNote
      v-if="option === 'treatment_vets'"
      v-model="state.note"
      :values="values"
      :reset="reset"
    />
    <FormInputCheckbox
      v-model="state.modus"
      label="active"
      table-id="modus"
      :values="values"
      :reset="reset"
      status-active="yes"
      status-inactive="no"
    />
    <FormInputCheckbox
      v-model="state.favorite"
      label="favorite"
      :values="values"
      :reset="reset"
      status-active="yes"
      status-inactive="no"
    />
    <FormStockRecipe
      v-if="showRecipe"
      ref="recipeForm"
      :table="option as RecipeTable"
      :type-id="recipeType?.id ?? null"
      :type-name="state.name || recipeType?.name || ''"
      :unit="state.unit || recipeType?.unit || null"
    />
  </q-form>
  <FormButtons
    class="q-pt-md"
    :state="state"
    :is-edit="isEdit"
    :edit-ids="editOptions"
    :v="v"
    form="option"
    :form-option="props.option"
    @reset="onReset"
    @change="onChange"
  />
</template>
