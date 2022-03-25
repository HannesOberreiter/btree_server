<template>
  <q-form class="full-width" @submit.prevent.stop="onSubmit">
    <form-common-edit
      v-if="ids"
      v-model="editOptions"
      :options="editOptionsCopy"
      off-label="name"
    ></form-common-edit>
    <div class="row">
      <div class="col-11">
        <form-common-date v-model="state.date"></form-common-date>
      </div>
      <div class="col-1 text-center items-center">
        <q-btn
          flat
          round
          icon="fas fa-retweet"
          :color="showInterval ? 'secondary' : 'grey'"
          @click="repeatTask"
        ></q-btn>
      </div>
    </div>
    <div v-if="showInterval" class="row q-pb-xs">
      <div class="col-6">
        <form-common-numeric-interval
          v-model.number="state.interval"
          label="interval"
          :hint="$t('intervalText')"
          :shadow-text="$t('day', 2)"
          :max-valid="365"
          icon=""
          numeric-valid="integer"
        ></form-common-numeric-interval>
      </div>
      <div class="col-6 q-pl-sm">
        <form-common-numeric-repeat
          v-model.number="state.repeat"
          label="repeat"
          :hint="$t('repeatText')"
          shadow-text="x"
          icon=""
          numeric-valid="integer"
        ></form-common-numeric-repeat>
      </div>
    </div>
    <form-common-name v-model="state.name"></form-common-name>
    <form-common-note v-model="state.note"></form-common-note>
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
import { useI18n } from 'vue-i18n';
import { useNotification } from '~/composables/useResponseText';
import dayjs from 'dayjs';
import FormCommonDate from './FormCommonDate.vue';
import FormCommonName from './FormCommonName.vue';
import FormCommonNote from './FormCommonNote.vue';
import FormCommonEdit from './FormCommonEdit.vue';
import FormCommonNumericRepeat from './FormCommonNumeric.vue';
import FormCommonNumericInterval from './FormCommonNumeric.vue';
import useVuelidate from '@vuelidate/core';
import { flatten, map, merge, uniq } from 'lodash';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const notification = useNotification();
const showInterval = ref(false);
const lastInsert = ref(null);
const router = useRouter();
const props = defineProps({
  ids: {
    type: Array,
    default: null,
  },
  date: {
    type: String,
    default: dayjs().format('YYYY-MM-DD'),
  },
});
const emit = defineEmits<{
  (e: 'onSuccess', value: boolean): void;
}>();

if (props.ids) getEdit();
if (props.ids === null && router.currentRoute.value.name === 'edit-todo')
  router.replace({ name: 'new-todo' });

const v = useVuelidate();

const editOptions = ref([]) as any;
const editOptionsCopy = ref([]) as any;
let editDefault = {};
const multipleValues = ref({
  date: false,
  name: false,
  note: false,
});
let multipleValuesCopy = {};

const stateDefault = {
  date: props.date,
  name: '',
  note: '',
  interval: 0,
  repeat: 0,
};

const state = ref({
  ...stateDefault,
});

const isSubmitting = ref(false);

async function onSubmit() {
  isSubmitting.value = true;
  const isFormCorrect = await v.value.$validate();
  if (!isFormCorrect) {
    isSubmitting.value = false;
    return;
  }
  const data = JSON.stringify({ ...state.value });
  await api.post('/v1/todo', data).then(
    (response: any) => {
      lastInsert.value = response.data;
      notification.open('positive', '');
      emit('onSuccess', true);
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
  isSubmitting.value = false;
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
  return await api.post('/v1/todo/batchGet', { ids: props.ids }).then(
    (response: any) => {
      const editIds = map(response.data, (row: any) => [
        { value: row.id, label: `ID: ${row.id} / (${row.name})` },
      ]);
      editOptions.value = flatten(editIds);
      editOptionsCopy.value = flatten(editIds);

      setValues(response.data, 'name');
      setValues(response.data, 'date');
      setValues(response.data, 'note');

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

async function onUndo() {
  isSubmitting.value = true;
  const data = JSON.stringify({ ids: lastInsert.value });
  await api.patch('/v1/todo/batchDelete?hard=true', data).then(
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

async function onUpdate() {
  isSubmitting.value = true;
  const isFormCorrect = await v.value.$validate();
  if (!isFormCorrect) {
    isSubmitting.value = false;
    return;
  }
  const ids = editOptions.value.map((obj: any) => obj.value);
  let data = { ids: ids, ...state.value, ignore: { ...multipleValues.value } };
  await api.patch('/v1/todo', JSON.stringify(data)).then(
    (response: any) => {
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

function onReset() {
  if (!props.ids) {
    merge(state.value, stateDefault);
  } else {
    merge(state.value, editDefault);
    merge(multipleValues.value, multipleValuesCopy);
  }
  if (showInterval.value) repeatTask();
  notification.open('positive', t('successReset'));
}

function repeatTask() {
  showInterval.value = !showInterval.value;
  if (!showInterval.value) {
    state.value.interval = 0;
    state.value.repeat = 0;
  }
}
</script>
