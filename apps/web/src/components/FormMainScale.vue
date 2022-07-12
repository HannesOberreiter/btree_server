<template>
  <q-form class="full-width" data-cy="form-scale" @submit.prevent.stop="">
    <form-dropdown-edit
      v-if="isEdit"
      v-model="editOptions"
      :options="editOptionsCopy"
      off-label="name"
    ></form-dropdown-edit>
    <form-input-text
      v-model="state.name"
      label="name"
      name="scale"
      icon="fas fa-passport"
      :hint="$t('scale.nameHint')"
      :values="values"
      :reset="reset"
      :required="true"
    ></form-input-text>
    <form-dropdown-option
      v-model="state.hive"
      table="hive"
      label="hive"
      table-id="hive_id"
      :values="values"
      :reset="reset"
    ></form-dropdown-option>
  </q-form>
  <form-buttons
    class="q-pt-md"
    :state="state"
    :is-edit="isEdit"
    :edit-ids="editOptions"
    :v="v"
    form="scale"
    @reset="onReset"
    @change="emit('onSuccess', true)"
  >
  </form-buttons>
</template>

<script setup lang="ts">
import { useNotification } from '~/composables/useNotification';
import useVuelidate from '@vuelidate/core';
import { flatten, map, merge } from 'lodash-es';
import { FormScale } from '~/types';
import { useApiFetch } from '~/composables/useApi';

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
  name: '',
};

const state = ref<FormScale>({
  hive: undefined as any,
  ...stateDefault,
});

async function getEdit(id: unknown[]) {
  return await api.get(`/v1/scale/${id[0]}`).then(
    (response: any) => {
      const editIds = map(response, (row: any) => {
        return [{ value: row.id, label: `ID: ${row.id} / (${row.name})` }];
      });
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
