<template>
  <q-form class="full-width" @submit.prevent.stop="">
    <form-dropdown-edit
      v-if="isEdit"
      v-model="editOptions"
      :options="editOptionsCopy"
    ></form-dropdown-edit>
    <form-dropdown-hive
      v-else
      v-model="state.hive"
      :selected="selected"
    ></form-dropdown-hive>

    <input-date
      v-model="state.date"
      label="movedate"
      table-id="date"
      :required="isEdit ? false : true"
      :values="values"
      :reset="reset"
    ></input-date>
    <form-dropdown-option
      v-model="state.apiary"
      label="apiary"
      table="apiary"
      table-id="apiary_id"
      :values="values"
      :reset="reset"
    >
    </form-dropdown-option>
  </q-form>

  <form-buttons
    class="q-pt-md"
    :state="state"
    :is-edit="isEdit"
    :edit-ids="editOptions"
    :v="v"
    form="movedate"
    @reset="onReset"
    @change="emit('onSuccess', true)"
  >
  </form-buttons>
</template>

<script setup lang="ts">
import { useNotification } from '~/composables/useResponseText';
import useVuelidate from '@vuelidate/core';
import { flatten, map, merge } from 'lodash-es';
import { useDateFormat } from '~/composables/useDate';
import { useApiFetch } from '~/composables/useApi';

const useDate = useDateFormat();
const notification = useNotification();
const api = useApiFetch();
const values = ref({});
const reset = ref(0);
const router = useRouter();
const emit = defineEmits(['onSuccess']);
const props = defineProps({
  ids: {
    type: Array,
    default: null,
  },
  selected: {
    type: Array,
    default: null,
  },
});
const ids = ref(props.ids);
const isEdit = computed(() => {
  if (ids.value === null) return false;
  if (ids.value.length === 0) return false;
  return true;
});
if (isEdit.value) getEdit(unref(ids.value));
if (!isEdit.value && router.currentRoute.value.name === 'edit-movement')
  router.push({ name: 'new-movement' });

const editOptions = ref([]) as any;
const editOptionsCopy = ref([]) as any;

const stateDefault = {
  date: useDate.isoFormat(useDate.getCurrent()),
};
const state = ref({
  hive: [] as any,
  apiary: undefined as any,
  ...stateDefault,
});

const rules = {};
const v = useVuelidate(rules, state, { $autoDirty: true });

function onReset() {
  if (!props.ids) {
    merge(state.value, stateDefault);
  }
  reset.value++;
  notification.open('positive', 'successReset');
}

async function getEdit(id: unknown[]) {
  return await api.post('/v1/movedate/batchGet', { ids: id }).then(
    (response: any) => {
      const editIds = map(response, (row: any) => [
        { value: row.id, label: `ID: ${row.id} / (${row.hive.name})` },
      ]);
      editOptions.value = flatten(editIds);
      editOptionsCopy.value = flatten(editIds);
      editOptionsCopy.value = [...unref(editOptions.value)];
      values.value = response;
    },
    (error) => {
      notification.open('negative', error);
    }
  );
}
</script>
