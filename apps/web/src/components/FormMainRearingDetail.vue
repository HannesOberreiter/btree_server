<script setup lang="ts">
import type { FormRearingDetail } from '../types';
import useVuelidate from '@vuelidate/core';
import { flatten, map, merge } from 'lodash-es';
import { computed, ref, unref } from 'vue';
import { useApiFetch } from '../composables/useApi';
import { useNotification } from '../composables/useNotification';
import FormButtons from './FormButtons.vue';
import FormDropdownEdit from './FormDropdownEdit.vue';
import FormInputNote from './FormInputNote.vue';
import FormInputText from './FormInputText.vue';

const props = defineProps({
  ids: {
    type: Array,
    default: null
  }
});
const emit = defineEmits<{
  (e: 'success', value: boolean): void;
}>();
const notification = useNotification();
const values = ref({});
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

const editOptions = ref([]) as any;
const editOptionsCopy = ref([]) as any;

const stateDefault = {
  job: '',
  note: ''
};

const state = ref<FormRearingDetail>({
  ...stateDefault
});

async function getEdit(id: unknown[]) {
  return await api.post('/v1/rearing_detail/batchGet', { ids: id }).then(
    (response: any) => {
      const editIds = map(response, (row: any) => [
        { value: row.id, label: `ID: ${row.id} / (${row.job})` }
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
  <q-form class="full-width" @submit.prevent.stop="">
    <FormDropdownEdit
      v-if="isEdit"
      v-model="editOptions"
      :options="editOptionsCopy"
      off-label="job"
    />
    <FormInputText
      v-model="state.job"
      label="job"
      icon="fas fa-passport"
      :values="values"
      :reset="reset"
      :required="isEdit ? false : true"
      :max-valid="50"
    />
    <FormInputNote v-model="state.note" :values="values" :reset="reset" />
  </q-form>
  <FormButtons
    class="q-pt-md"
    :state="state"
    :is-edit="isEdit"
    :edit-ids="editOptions"
    :v="v"
    form="rearing_detail"
    @reset="onReset"
    @change="emit('success', true)"
  />
</template>
