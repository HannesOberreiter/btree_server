<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { flatten, map, merge } from 'lodash-es';
import { computed, ref, unref } from 'vue';
import { useRouter } from 'vue-router';
import { useApiFetch } from '../composables/useApi';
import { useDateFormat } from '../composables/useDate';
import { useNotification } from '../composables/useNotification';
import FormButtons from './FormButtons.vue';
import FormDropdownEdit from './FormDropdownEdit.vue';
import FormDropdownHive from './FormDropdownHive.vue';
import FormDropdownOption from './FormDropdownOption.vue';
import FormInputDate from './FormInputDate.vue';

const props = defineProps({
  ids: {
    type: Array,
    default: null
  },
  selected: {
    type: Array,
    default: null
  }
});
const emit = defineEmits(['success']);
const useDate = useDateFormat();
const notification = useNotification();
const api = useApiFetch();
const values = ref({});
const reset = ref(0);
const formEvent = ref<string>('');

const router = useRouter();
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
if (!isEdit.value && router.currentRoute.value.name === 'edit-movement') {
  router.push({ name: 'new-movement' });
}

const editOptions = ref([]) as any;
const editOptionsCopy = ref([]) as any;

const stateDefault = {
  date: useDate.isoFormat(useDate.getCurrent())
};
const state = ref({
  hive: [] as any,
  apiary: undefined as any,
  ...stateDefault
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
        { value: row.id, label: `ID: ${row.id} / (${row.hive.name})` }
      ]);
      editOptions.value = flatten(editIds);
      editOptionsCopy.value = flatten(editIds);
      editOptionsCopy.value = [...unref(editOptions.value)];
      values.value = response;
    },
    error => {
      notification.open('negative', error);
    }
  );
}

function onChange(type: 'update' | 'insert' = 'update') {
  formEvent.value = type;
  emit('success', true);
}
</script>

<template>
  <q-form class="full-width" data-cy="form-movement" @submit.prevent.stop="">
    <FormDropdownEdit
      v-if="isEdit"
      v-model="editOptions"
      :options="editOptionsCopy"
    />
    <FormDropdownHive
      v-else
      v-model="state.hive"
      :selected="selected"
      :form-event="formEvent"
    />

    <FormInputDate
      v-model="state.date"
      label="movedate"
      table-id="date"
      :required="isEdit ? false : true"
      :values="values"
      :reset="reset"
    />
    <FormDropdownOption
      v-model="state.apiary"
      label="apiary"
      table="apiary"
      table-id="apiary_id"
      :values="values"
      :reset="reset"
    />
  </q-form>

  <FormButtons
    class="q-pt-md"
    :state="state"
    :is-edit="isEdit"
    :edit-ids="editOptions"
    :v="v"
    form="movedate"
    @reset="onReset"
    @change="(val: 'update' | 'insert') => onChange(val)"
  />
</template>
