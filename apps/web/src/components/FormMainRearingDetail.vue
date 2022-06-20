<template>
  <q-form class="full-width" @submit.prevent.stop="">
    <form-dropdown-edit
      v-if="isEdit"
      v-model="editOptions"
      :options="editOptionsCopy"
      off-label="job"
    ></form-dropdown-edit>
    <form-input-text
      v-model="state.job"
      label="job"
      icon="fas fa-passport"
      :values="values"
      :reset="reset"
      :required="isEdit ? false : true"
      :max-valid="50"
    ></form-input-text>
    <form-input-numeric
      v-model="state.hour"
      label="waitTime"
      icon="fas fa-hourglass"
      shadow-text="h"
      :hint="$t('rear.detailHourText')"
      :values="values"
      :reset="reset"
      :max-valid="5000"
    ></form-input-numeric>
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
    form="rearing_detail"
    @reset="onReset"
    @change="emit('onSuccess', true)"
  >
  </form-buttons>
</template>

<script setup lang="ts">
import { useNotification } from '~/composables/useNotification';
import useVuelidate from '@vuelidate/core';
import { flatten, map, merge } from 'lodash-es';
import { FormRearingDetail } from '~/types';
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
  job: '',
  hour: 0,
  note: '',
};

const state = ref<FormRearingDetail>({
  ...stateDefault,
});

async function getEdit(id: unknown[]) {
  return await api.post('/v1/rearing_detail/batchGet', { ids: id }).then(
    (response: any) => {
      const editIds = map(response, (row: any) => [
        { value: row.id, label: `ID: ${row.id} / (${row.job})` },
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
