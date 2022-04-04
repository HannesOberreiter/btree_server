<template>
  <q-form class="full-width" @submit.prevent.stop="">
    <form-dropdown-edit
      v-if="isEdit"
      v-model="editOptions"
      :options="editOptionsCopy"
    ></form-dropdown-edit>
    <form-dropdown-hive v-else v-model="state.hive"></form-dropdown-hive>

    <input-date
      v-model="state.date"
      label="movedate"
      table-id="date"
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
    :state="state"
    :is-edit="isEdit"
    :edit-ids="editOptions"
    :v="v"
    form="movedate"
    @reset="onReset"
  >
  </form-buttons>
</template>

<script setup lang="ts">
import { api } from '~/boot/axios';
import { useNotification } from '~/composables/useResponseText';
import dayjs from 'dayjs';
import InputDate from './FormInputDate.vue';
import FormDropdownEdit from './FormDropdownEdit.vue';
import FormDropdownHive from './FormDropdownHive.vue';
import useVuelidate from '@vuelidate/core';
import { flatten, map, merge } from 'lodash';
import FormButtons from './FormButtons.vue';
import FormDropdownOption from './FormDropdownOption.vue';

const notification = useNotification();
const values = ref({});
const reset = ref(0);
const router = useRouter();
const props = defineProps({
  ids: {
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
  date: dayjs().format('YYYY-MM-DD'),
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
      const editIds = map(response.data, (row: any) => [
        { value: row.id, label: `ID: ${row.id} / (${row.hive.name})` },
      ]);
      editOptions.value = flatten(editIds);
      editOptionsCopy.value = flatten(editIds);
      editOptionsCopy.value = [...unref(editOptions.value)];
      values.value = response.data;
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
}
</script>
