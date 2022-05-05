<template>
  <q-form class="full-width" @submit.prevent.stop="">
    <form-dropdown-edit
      v-if="isEdit"
      v-model="editOptions"
      :options="editOptionsCopy"
      off-label="name"
    ></form-dropdown-edit>
    <form-input-text
      v-model="state.name"
      label="name"
      icon="fas fa-passport"
      :values="values"
      :reset="reset"
      :required="true"
    ></form-input-text>
    <form-input-note
      v-model="state.note"
      label="note"
      :values="values"
      :reset="reset"
    >
    </form-input-note>
  </q-form>
  <form-buttons
    class="q-pt-md"
    :state="state"
    :is-edit="isEdit"
    :edit-ids="editOptions"
    :v="v"
    form="rearing_type"
    @reset="onReset"
    @change="emit('onSuccess', true)"
  >
  </form-buttons>
</template>

<script setup lang="ts">
import { useNotification } from '~/composables/useNotification';
import useVuelidate from '@vuelidate/core';
import { flatten, map, merge } from 'lodash-es';
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
  note: '',
};

const state = ref({
  ...stateDefault,
});

async function getEdit(id: unknown[]) {
  return await api.post('/v1/rearing_type/batchGet', { ids: id }).then(
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
