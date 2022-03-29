<template>
  <q-form class="full-width" @submit.prevent.stop="onSubmit">
    <form-common-dropdown-hive
      v-if="!ids"
      v-model="state.hive"
    ></form-common-dropdown-hive>
    <form-common-edit
      v-else
      v-model="editOptions"
      :options="editOptionsCopy"
    ></form-common-edit>

    <input-date v-model="state.date" label="movedate"></input-date>

    <form-common-dropdown-apiary
      v-model="state.apiary"
    ></form-common-dropdown-apiary>
  </q-form>

  <q-btn-group v-if="!ids" spread>
    <q-btn
      unelevated
      size="md"
      color="secondary"
      :loading="isSubmitting"
      :label="$t('save')"
      @click="onSubmit"
    />
    <q-btn
      unelevated
      size="md"
      color="warning"
      :label="$t('reset')"
      @click="onReset"
    />
    <q-btn
      v-if="lastInsert"
      unelevated
      size="md"
      color="info"
      :loading="isSubmitting"
      :label="$t('undo')"
      @click="onUndo"
    />
  </q-btn-group>
  <q-btn-group v-else spread>
    <q-btn
      unelevated
      size="md"
      color="secondary"
      :loading="isSubmitting"
      :label="$t('update')"
      @click="onUpdate"
    ></q-btn>
    <q-btn
      unelevated
      size="md"
      color="warning"
      :label="$t('reset')"
      @click="onReset"
    />
  </q-btn-group>
</template>

<script setup lang="ts">
import { api } from '~/boot/axios';
import { ref } from 'vue';
import { useNotification } from '~/composables/useResponseText';
import dayjs from 'dayjs';
import InputDate from './FormInputDate.vue';
import FormCommonDropdownApiary from './FormCommonDropdownApiary.vue';
import FormCommonEdit from './FormCommonEdit.vue';
import FormCommonDropdownHive from './FormCommonDropdownHive.vue';
import useVuelidate from '@vuelidate/core';
import { flatten, map, merge, uniq } from 'lodash';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const notification = useNotification();
const isSubmitting = ref(false);
const router = useRouter();
const lastInsert = ref(null);
const props = defineProps({
  ids: {
    type: Array,
    default: null,
  },
});

const editOptions = ref([]) as any;
const editOptionsCopy = ref([]) as any;
let editDefault = {};
const multipleValues = ref({
  apiary_id: false,
  date: false,
});
let multipleValuesCopy = {};

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

if (props.ids) getEdit();
if (props.ids === null && router.currentRoute.value.name === 'edit-movement')
  router.replace({ name: 'new-movement' });

function onReset() {
  if (!props.ids) {
    merge(state.value, stateDefault);
  } else {
    merge(state.value, editDefault);
    merge(multipleValues.value, multipleValuesCopy);
  }
  notification.open('positive', t('successReset'));
}

function setValues(data: any, state_name: string, response_name = '') {
  if (response_name === '') response_name = state_name;
  const state_array = state_name.split('.');
  const r = map(data, (row: any) => row[response_name]);
  const u = uniq(r);
  if (u.length > 1)
    if (state_array.length > 1)
      (multipleValues.value as any)[state_array[0]][state_array[1]] = true;
    else (multipleValues.value as any)[state_array[0]] = true;

  let value = u[0] as any;
  if (response_name === 'date') {
    value = dayjs(value).format('YYYY-MM-DD');
  }
  if (state_array.length > 1)
    (state.value as any)[state_array[0]][state_array[1]] = value;
  else (state.value as any)[state_array[0]] = value;

  return;
}

async function getEdit() {
  return await api.post('/v1/movedate/batchGet', { ids: props.ids }).then(
    (response: any) => {
      const editIds = map(response.data, (row: any) => [
        { value: row.id, label: `ID: ${row.id} / (${row.hive.name})` },
      ]);
      editOptions.value = flatten(editIds);
      editOptionsCopy.value = flatten(editIds);
      setValues(response.data, 'date');

      setValues(response.data, 'apiary');
      state.value.apiary['label'] = state.value.apiary.name;
      setValues(response.data, 'apiary_id');

      console.log(state.value);
      notification.open('info', t('dataLoaded'));

      // Copies so we can reset it
      multipleValuesCopy = { ...multipleValues.value };
      editDefault = { ...state.value };
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
}

async function onUpdate() {
  isSubmitting.value = true;
  const isFormCorrect = await v.value.$validate();
  if (!isFormCorrect) {
    isSubmitting.value = false;
    return;
  }
  const ids = editOptions.value.map((obj: any) => obj.value);
  let data = { ids: ids, ...state.value, ignore: { ...multipleValues.value } };
  data.apiary = data.apiary ? data.apiary.id : 0;

  await api.patch('/v1/movedate', JSON.stringify(data)).then(
    (response: any) => {
      console.log(response);
      lastInsert.value = response.data;
      notification.open('positive', '');
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
  isSubmitting.value = false;
  return;
}

async function onUndo() {
  isSubmitting.value = true;
  const data = JSON.stringify({ ids: lastInsert.value });
  await api.patch('/v1/movedate/batchDelete', data).then(
    (_response: any) => {
      lastInsert.value = null;
      notification.open('positive', '');
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
  isSubmitting.value = false;
  return;
}

async function onSubmit() {
  isSubmitting.value = true;
  const isFormCorrect = await v.value.$validate();
  if (!isFormCorrect) {
    isSubmitting.value = false;
    return;
  }
  const data = { ...state.value };
  data.hive = state.value.hive.map((obj: any) => obj.hive_id);
  data.apiary = data.apiary ? data.apiary.id : 0;

  await api.post('/v1/movedate', JSON.stringify(data)).then(
    (response: any) => {
      lastInsert.value = response.data;
      notification.open('positive', '');
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
  isSubmitting.value = false;
}
</script>
