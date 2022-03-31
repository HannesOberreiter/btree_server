<template>
  <form-common-dropdown-hive
    v-if="!ids"
    v-model="state.hive"
  ></form-common-dropdown-hive>
  <form-common-edit
    v-else
    v-model="editOptions"
    :options="editOptionsCopy"
  ></form-common-edit>
  <div class="q-pt-xs">
    <input-dates
      v-model:start-value="state.date"
      v-model:end-value="state.enddate"
      v-model:model-interval="state.interval"
      v-model:model-repeat="state.repeat"
      :values="values"
      :reset="reset"
    ></input-dates>
  </div>
  <div class="q-mb-sm q-mt-sm">
    <!-- Main Dropdowns -->
    <div v-if="task === 'checkup'">
      <form-common-dropdown
        v-if="task === 'checkup'"
        v-model="state.type"
        v-model:model-multiple="multipleValues.type_id"
        table="checkup_types"
      ></form-common-dropdown>
    </div>
    <div v-else-if="task === 'harvest'" class="row">
      <div class="col-12 q-pb-sm">
        <form-common-dropdown
          v-model="state.type"
          v-model:model-multiple="multipleValues.type_id"
          table="harvest_types"
        ></form-common-dropdown>
      </div>
    </div>
    <div v-else-if="task === 'treatment'" class="row">
      <div class="col-12 col-md-6 q-pb-sm">
        <form-common-dropdown
          v-model="state.type"
          v-model:model-multiple="multipleValues.type_id"
          table="treatment_types"
        ></form-common-dropdown>
      </div>
      <div class="col-12 col-md-6 q-pb-sm">
        <form-common-dropdown-disease
          v-model="state.disease"
          v-model:model-multiple="multipleValues.disease_id"
          table="treatment_diseases"
          label="disease"
        ></form-common-dropdown-disease>
      </div>
    </div>
    <div v-else-if="task === 'feed'" class="row">
      <div class="col-12 q-pb-sm">
        <form-common-dropdown
          v-model="state.type"
          v-model:model-multiple="multipleValues.type_id"
          table="feed_types"
        ></form-common-dropdown>
      </div>
    </div>
    <!-- Main Amount Field -->
    <div v-if="task !== 'checkup'" class="row">
      <div class="col-12 col-md-7 q-pt-sm">
        <form-common-amount
          v-model="state.amount"
          v-model:model-type="state.amount_type"
          v-model:model-calc="state.amount_calc"
          :hive-count="state.hive.length"
          :reset="reset"
          :values="values"
        ></form-common-amount>
      </div>
    </div>
    <!-- Additional optional fields -->
    <div v-if="task === 'checkup'">
      <form-checkup-queen
        v-if="fields.settings.checkup.queen"
        v-model="state.checkup_queen"
        v-model:model-multiple="multipleValues.checkup_queen"
      ></form-checkup-queen>
      <form-checkup-rating
        v-if="fields.settings.checkup.rating"
        v-model="state.checkup_rating"
        v-model:model-multiple="multipleValues.checkup_rating"
      ></form-checkup-rating>
      <form-checkup-frames
        v-if="fields.settings.checkup.frames"
        v-model="state.checkup_frames"
        v-model:model-multiple="multipleValues.checkup_frames"
      ></form-checkup-frames>
      <div class="row q-pt-sm q-pb-sm">
        <div class="col-12 col-md-7">
          <form-checkup-varroa
            v-if="fields.settings.checkup.varroa"
            v-model="state.checkup_varroa"
            :reset="reset"
            :values="values"
          ></form-checkup-varroa>
        </div>
      </div>
      <div v-if="fields.settings.checkup.strength" class="row q-pt-sm q-pb-sm">
        <div class="col-12 col-md-6">
          <input-numeric-strength
            v-model="state.checkup_strong"
            :values="values"
            :reset="reset"
            label="strong"
            icon="fas fa-dumbbell"
          >
          </input-numeric-strength>
        </div>
      </div>
      <div v-if="fields.settings.checkup.weight" class="q-pt-sm q-pb-sm">
        <form-checkup-weight
          v-model="state.checkup_weight_amount"
          v-model:model-time="state.checkup_weight_time"
          :reset="reset"
          :values="values"
        ></form-checkup-weight>
      </div>
      <div
        v-if="fields.settings.checkup.temperature"
        class="row q-pt-sm q-pb-sm"
      >
        <div class="col-12 col-md-7">
          <form-checkup-temperature
            v-model="state.checkup_temp"
            :hive="state.hive"
            :reset="reset"
            :values="values"
          ></form-checkup-temperature>
        </div>
      </div>
    </div>
    <div v-else-if="task === 'harvest'">
      <div v-if="fields.settings.harvest.frames" class="row">
        <div class="col-12 col-md-7">
          <form-common-amount-frames
            v-model="state.harvest_frames"
            v-model:model-type="state.harvest_amount_type"
            v-model:model-calc="state.harvest_amount_calc"
            :reset="reset"
            :values="values"
            :hive-count="state.hive.length"
            label="frame"
          ></form-common-amount-frames>
        </div>
      </div>
      <div v-if="fields.settings.harvest.water" class="row">
        <div class="col-12 col-md-6">
          <input-numeric-water
            v-model="state.harvest_water"
            :values="values"
            :reset="reset"
            label="water"
            icon="fas fa-droplet"
            shadow-text="%"
          ></input-numeric-water>
        </div>
      </div>
      <div class="row">
        <div class="col-12 col-md-6">
          <form-common-charge
            v-model="state.harvest_charge"
            v-model:model-multiple="multipleValues.harvest_charge"
          ></form-common-charge>
        </div>
      </div>
    </div>
    <div v-else-if="task === 'treatment'" class="row">
      <div v-if="fields.settings.treatment.vet" class="col-12 q-pb-sm">
        <form-common-dropdown-vet
          v-model="state.treatment_vet"
          v-model:model-multiple="multipleValues.vet_id"
          table="treatment_vets"
          label="vet"
        ></form-common-dropdown-vet>
      </div>
      <div
        v-if="fields.settings.treatment.wait"
        class="col-12 col-md-6 q-pb-sm"
      >
        <input-numeric-wait
          v-model="state.treatment_wait"
          :values="values"
          :reset="reset"
          label="waitTime"
          :shadow-text="t('day', 2)"
          icon="fas fa-circle-pause"
          :max-valid="365"
        ></input-numeric-wait>
      </div>
    </div>
  </div>
  <form-common-url
    v-model="state.url"
    v-model:model-multiple="multipleValues.url"
  ></form-common-url>
  <input-note v-model="state.note" :values="values" :reset="reset"></input-note>
  <form-common-done
    v-model="state.done"
    v-model:model-multiple="multipleValues.done"
  ></form-common-done>

  <q-btn-group v-if="!ids" spread>
    <q-btn
      unelevated
      size="md"
      color="secondary"
      :loading="isSubmitting"
      :label="t('save')"
      @click="onSubmit"
    />
    <q-btn
      unelevated
      size="md"
      color="warning"
      :label="t('reset')"
      @click="onReset"
    />
    <q-btn
      v-if="lastInsert"
      unelevated
      size="md"
      color="info"
      :label="t('undo')"
      @click="onUndo"
    />
  </q-btn-group>
  <q-btn-group v-else spread>
    <q-btn
      unelevated
      size="md"
      color="secondary"
      :loading="isSubmitting"
      :label="t('update')"
      @click="onUpdate"
    ></q-btn>
    <q-btn
      unelevated
      size="md"
      color="warning"
      :label="t('reset')"
      @click="onReset"
    />
  </q-btn-group>
</template>

<script setup lang="ts">
import { api } from '~/boot/axios';
import { PropType, ref } from 'vue';
import useVuelidate from '@vuelidate/core';
import { useNotification } from '~/composables/useResponseText';
import { Task } from '~/types';
import { useFieldsettingStore } from '~/stores/fieldsetting';
import { useI18n } from 'vue-i18n';
import { flatten, map, merge, uniq } from 'lodash';
import dayjs from 'dayjs';
import { useRouter } from 'vue-router';

import FormCheckupFrames from './FormCheckupFrames.vue';
import FormCheckupQueen from './FormCheckupQueen.vue';
import FormCheckupRating from './FormCheckupRating.vue';

import FormCheckupTemperature from './FormCheckupTemperature.vue';
import FormCheckupVarroa from './FormCheckupVarroa.vue';
import FormCheckupWeight from './FormCheckupWeight.vue';
import FormCommonAmount from './FormCommonAmount.vue';
import FormCommonAmountFrames from './FormCommonAmount.vue';
import FormCommonCharge from './FormCommonCharge.vue';
import InputDates from './FormInputDates.vue';
import FormCommonDone from './FormCommonDone.vue';
import FormCommonDropdown from './FormCommonDropdownOption.vue';
import FormCommonDropdownDisease from './FormCommonDropdownOption.vue';
import FormCommonDropdownVet from './FormCommonDropdownOption.vue';
import FormCommonDropdownHive from './FormCommonDropdownHive.vue';
import InputNote from './FormInputNote.vue';
import FormCommonUrl from './FormCommonUrl.vue';
import FormCommonEdit from './FormCommonEdit.vue';
import InputNumericWater from './FormInputNumeric.vue';
import InputNumericStrength from './FormInputNumeric.vue';
import InputNumericWait from './FormInputNumeric.vue';

const fields = useFieldsettingStore();
const notification = useNotification();
const { t } = useI18n();
const isSubmitting = ref(false);
const v = useVuelidate();
const lastInsert = ref(null);
const lastInsertTable = ref(null);
const router = useRouter();
const values = ref({});
const reset = ref(0);
const props = defineProps({
  task: {
    type: String as PropType<Task>,
    required: true,
  },
  ids: {
    type: Array,
    default: null,
  },
});

if (props.ids) getEdit();
if (props.ids === null && router.currentRoute.value.name === 'edit-quicktool')
  router.replace({ name: 'new-quicktool' });

const editOptions = ref([]) as any;
const editOptionsCopy = ref([]) as any;

const multipleValues = ref({
  date: false,
  enddate: false,
  amount: false,
  type_id: false,
  disease_id: false,
  vet_id: false,
  url: false,
  note: false,
  done: false,
  checkup_queen: false,
  checkup_rating: {
    brood: false,
    pollen: false,
    comb: false,
    temper: false,
    calm_comb: false,
    swarm: false,
  },
  checkup_frames: {
    broodframes: false,
    honeyframes: false,
    foundation: false,
    emptyframes: false,
  },
  checkup_varroa: false,
  checkup_strong: false,
  checkup_weight_amount: false,
  checkup_weight_time: false,
  checkup_temp: false,

  harvest_frames: false,
  harvest_water: false,
  harvest_charge: false,

  treatment_wait: false,
});
let multipleValuesCopy = {};
const stateDefault = {
  date: dayjs().format('YYYY-MM-DD'),
  enddate: dayjs().format('YYYY-MM-DD'),
  interval: 0,
  repeat: 0,
  amount: 0,
  amount_type: 'single',
  amount_calc: 0,
  url: '',
  note: '',
  done: true,

  checkup_queen: [] as any,
  checkup_rating: {
    brood: 0,
    pollen: 0,
    comb: 0,
    temper: 0,
    calm_comb: 0,
    swarm: 0,
  },
  checkup_frames: {
    broodframes: 0,
    honeyframes: 0,
    foundation: 0,
    emptyframes: 0,
  },
  checkup_varroa: 0,
  checkup_strong: 0,
  checkup_weight_amount: 0,
  checkup_weight_time: dayjs().format('HH:mm'),
  checkup_temp: 0,

  harvest_frames: 0,
  harvest_amount_type: 'single',
  harvest_amount_calc: 0,
  harvest_water: 0,
  harvest_charge: '',

  treatment_wait: 0,
};
let editDefault = {};

const state = ref({
  hive: [] as any,
  type: null as any,
  disease: null as any,
  treatment_vet: null as any,
  ...stateDefault,
});

function setValues(data: any, state_name: string, response_name = '') {
  if (response_name === '') response_name = state_name;
  const state_array = state_name.split('.');
  const r = map(data, (row: any) => row[response_name]);
  const u = uniq(r);
  if (u.length > 1)
    if (state_array.length > 1)
      (multipleValues.value as any)[state_array[0]][state_array[1]] = true;
    else (multipleValues.value as any)[state_array[0]] = true;

  if (['queen', 'queencells', 'capped_brood', 'eggs'].includes(response_name)) {
    if (u.length > 1 || (u[0] && u.length === 1))
      state.value.checkup_queen.push(response_name);
  } else {
    let value = u[0] as any;
    if (response_name === 'date' || response_name === 'enddate') {
      value = dayjs(value).format('YYYY-MM-DD');
    }
    if (response_name === 'time') {
      value = dayjs(value, 'HH:mm:ss').format('HH:mm');
    }
    if (state_array.length > 1)
      (state.value as any)[state_array[0]][state_array[1]] = value;
    else (state.value as any)[state_array[0]] = value;
  }

  return;
}

async function getEdit() {
  return await api.post(`/v1/${props.task}/batchGet`, { ids: props.ids }).then(
    (response: any) => {
      const editIds = map(response.data, (row: any) => [
        { value: row.id, label: `ID: ${row.id} / (${row.hive.name})` },
      ]);
      editOptions.value = flatten(editIds);
      editOptionsCopy.value = flatten(editIds);

      values.value = response.data;

      console.log(values.value);

      setValues(response.data, 'date', 'enddate'); // Dirty workaround as I block date change if date or enddate is different
      setValues(response.data, 'date');
      setValues(response.data, 'enddate', 'enddate');

      setValues(response.data, 'type');
      setValues(response.data, 'type_id');

      setValues(response.data, 'done');
      setValues(response.data, 'note');

      if (props.task === 'checkup') {
        setValues(response.data, 'checkup_frames.broodframes', 'broodframes');
        setValues(response.data, 'checkup_frames.honeyframes', 'honeyframes');
        setValues(response.data, 'checkup_frames.foundation', 'foundation');
        setValues(response.data, 'checkup_frames.emptyframes', 'emptyframes');

        setValues(response.data, 'checkup_rating.brood', 'brood');
        setValues(response.data, 'checkup_rating.calm_comb', 'calm_comb');
        setValues(response.data, 'checkup_rating.comb', 'comb');
        setValues(response.data, 'checkup_rating.pollen', 'pollen');
        setValues(response.data, 'checkup_rating.swarm', 'swarm');
        setValues(response.data, 'checkup_rating.temper', 'temper');

        setValues(response.data, 'checkup_temp', 'temp');
        setValues(response.data, 'checkup_varroa', 'varroa');
        setValues(response.data, 'checkup_strong', 'strong');
        setValues(response.data, 'checkup_weight_amount', 'weight');
        setValues(response.data, 'checkup_weight_time', 'time');

        setValues(response.data, 'checkup_weight_time', 'time');

        setValues(response.data, 'checkup_queen', 'queen');
        setValues(response.data, 'checkup_queen', 'queencells');
        setValues(response.data, 'checkup_queen', 'eggs');
        setValues(response.data, 'checkup_queen', 'capped_brood');
      } else if (props.task === 'treatment') {
        setValues(response.data, 'disease', 'disease');
        setValues(response.data, 'disease_id', 'disease_id');
        setValues(response.data, 'treatment_vet', 'vet');
        setValues(response.data, 'vet_id', 'vet_id');
        setValues(response.data, 'treatment_wait', 'wait');
      } else if (props.task === 'harvest') {
        setValues(response.data, 'harvest_frames', 'frames');
        setValues(response.data, 'harvest_water', 'water');
        setValues(response.data, 'harvest_charge', 'charge');
      }

      if (props.task !== 'checkup')
        setValues(response.data, 'amount', 'amount');

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

function onReset() {
  if (!props.ids) {
    merge(state.value, stateDefault);
    state.value.checkup_queen = []; // merge seems to not clear the array so we manually reset it here
  } else {
    merge(state.value, editDefault);
    merge(multipleValues.value, multipleValuesCopy);
  }
  notification.open('positive', t('successReset'));
  reset.value++;
}

async function onUndo() {
  isSubmitting.value = true;
  const data = JSON.stringify({ ids: lastInsert.value });
  await api
    .patch(`/v1/${lastInsertTable.value}/batchDelete?hard=true`, data)
    .then(
      (_response: any) => {
        lastInsert.value = null;
        lastInsertTable.value = null;
        notification.open('positive', '');
      },
      (error) => {
        notification.open('negative', error.response);
      }
    );

  isSubmitting.value = false;
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
  delete data.hive;
  data.type = data.type ? data.type.id : 0;
  data.disease = data.disease ? data.disease.id : 0;
  data.treatment_vet = data.treatment_vet ? data.treatment_vet.id : 0;
  data.checkup_weight_time = dayjs(data.checkup_weight_time, 'HH:mm').format(
    'HH:MM:ss'
  );
  await api.patch(`/v1/${props.task}`, JSON.stringify(data)).then(
    (response: any) => {
      console.log(response);
      lastInsert.value = response.data;
      lastInsertTable.value = props.task as any;
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
  const hive_ids = state.value.hive.map((obj: any) => obj.hive_id);

  let data = { ...state.value };
  delete data.hive;
  data.hive = hive_ids;
  data.type = data.type ? data.type.id : 0;
  data.disease = data.disease ? data.disease.id : 0;
  data.treatment_vet = data.treatment_vet ? data.treatment_vet.id : 0;
  data.checkup_weight_time = dayjs(data.checkup_weight_time, 'HH:mm').format(
    'HH:MM:ss'
  );
  await api.post(`/v1/${props.task}`, JSON.stringify(data)).then(
    (response: any) => {
      lastInsert.value = response.data;
      lastInsertTable.value = props.task as any;
      notification.open('positive', '');
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
  isSubmitting.value = false;
}
</script>
