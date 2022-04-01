<template>
  <form-dropdown-edit
    v-if="isEdit"
    v-model="editOptions"
    :options="editOptionsCopy"
  ></form-dropdown-edit>
  <form-dropdown-hive v-else v-model="state.hive"></form-dropdown-hive>

  <div class="q-pt-xs">
    <form-input-dates
      v-model:start-value="state.date"
      v-model:end-value="state.enddate"
      v-model:model-interval="state.interval"
      v-model:model-repeat="state.repeat"
      :values="values"
      :reset="reset"
    ></form-input-dates>
  </div>
  <div class="q-mb-sm q-mt-sm">
    <!-- Main Dropdowns -->
    <div v-if="task === 'checkup'">
      <form-dropdown-option
        v-if="task === 'checkup'"
        v-model="state.type"
        :values="values"
        :reset="reset"
        table="checkup_types"
      ></form-dropdown-option>
    </div>
    <div v-else-if="task === 'harvest'" class="row">
      <div class="col-12 q-pb-sm">
        <form-dropdown-option
          v-model="state.type"
          :values="values"
          :reset="reset"
          table="harvest_types"
        ></form-dropdown-option>
      </div>
    </div>
    <div v-else-if="task === 'treatment'" class="row">
      <div class="col-12 q-pb-sm">
        <form-dropdown-option
          v-model="state.type"
          :values="values"
          :reset="reset"
          table="treatment_types"
        ></form-dropdown-option>
      </div>
      <div class="col-12 q-pb-sm">
        <form-dropdown-disease
          v-model="state.disease"
          :values="values"
          :reset="reset"
          table="treatment_diseases"
          label="disease"
        ></form-dropdown-disease>
      </div>
    </div>
    <div v-else-if="task === 'feed'" class="row">
      <div class="col-12 q-pb-sm">
        <form-dropdown-option
          v-model="state.type"
          :values="values"
          :reset="reset"
          table="feed_types"
        ></form-dropdown-option>
      </div>
    </div>
    <!-- Main Amount Field -->
    <div v-if="task !== 'checkup'" class="row">
      <div class="col-12 col-md-7 q-pt-sm">
        <form-input-amount
          v-model="state.amount"
          v-model:model-type="state.amount_type"
          v-model:model-calc="state.amount_calc"
          :hive-count="state.hive.length"
          :reset="reset"
          :values="values"
        ></form-input-amount>
      </div>
    </div>
    <!-- Additional optional fields -->
    <div v-if="task === 'checkup'">
      <form-checkup-queen
        v-if="fields.settings.checkup.queen"
        v-model="state.checkup_queen"
        :values="values"
        :reset="reset"
      ></form-checkup-queen>
      <form-checkup-rating
        v-if="fields.settings.checkup.rating"
        v-model="state.checkup_rating"
        :reset="reset"
        :values="values"
      ></form-checkup-rating>
      <form-checkup-frames
        v-if="fields.settings.checkup.frames"
        v-model="state.checkup_frames"
        :values="values"
        :reset="reset"
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
          <form-input-frames
            v-model="state.harvest_frames"
            v-model:model-type="state.harvest_amount_type"
            v-model:model-calc="state.harvest_amount_calc"
            :reset="reset"
            :values="values"
            :hive-count="state.hive.length"
            label="frame"
          ></form-input-frames>
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
          <form-input-charge
            v-model="state.harvest_charge"
            label="charge"
            icon="fas fa-receipt"
            :values="values"
            :reset="reset"
          ></form-input-charge>
        </div>
      </div>
    </div>
    <div v-else-if="task === 'treatment'" class="row">
      <div v-if="fields.settings.treatment.vet" class="col-12 q-pb-sm">
        <form-dropdown-vet
          v-model="state.treatment_vet"
          :values="values"
          :reset="reset"
          table="treatment_vets"
          label="vet"
        ></form-dropdown-vet>
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
  <form-input-url
    v-model="state.url"
    :values="values"
    :reset="reset"
  ></form-input-url>
  <form-input-note
    v-model="state.note"
    :values="values"
    :reset="reset"
  ></form-input-note>
  <form-input-checkbox
    v-model="state.done"
    :values="values"
    :reset="reset"
  ></form-input-checkbox>

  <q-btn-group v-if="!isEdit" spread>
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
import { PropType } from 'vue';
import useVuelidate from '@vuelidate/core';
import { useNotification } from '~/composables/useResponseText';
import { Task } from '~/types';
import { useFieldsettingStore } from '~/stores/fieldsetting';
import { flatten, includes, isNil, map, merge, omitBy } from 'lodash';
import dayjs from 'dayjs';

import FormCheckupFrames from './FormCheckupFrames.vue';
import FormCheckupQueen from './FormCheckupQueen.vue';
import FormCheckupRating from './FormCheckupRating.vue';
import FormCheckupTemperature from './FormCheckupTemperature.vue';
import FormCheckupVarroa from './FormCheckupVarroa.vue';
import FormCheckupWeight from './FormCheckupWeight.vue';
import FormInputAmount from './FormInputAmount.vue';
import FormInputFrames from './FormInputAmount.vue';
import FormInputCharge from './FormInputText.vue';
import FormInputDates from './FormInputDates.vue';
import FormInputCheckbox from './FormInputCheckbox.vue';
import FormDropdownOption from './FormDropdownOption.vue';
import FormDropdownDisease from './FormDropdownOption.vue';
import FormDropdownVet from './FormDropdownOption.vue';
import FormDropdownHive from './FormDropdownHive.vue';
import FormInputUrl from './FormInputUrl.vue';
import FormDropdownEdit from './FormDropdownEdit.vue';
import FormInputNote from './FormInputNote.vue';
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
const ids = ref(props.ids);
const isEdit = computed(() => {
  if (ids.value === null) return false;
  if (ids.value.length === 0) return false;
  return true;
});

if (isEdit.value) getEdit(unref(ids.value));
if (isEdit.value && router.currentRoute.value.name === 'edit-quicktool')
  router.replace({ name: 'new-quicktool' });

const editOptions = ref([]) as any;
const editOptionsCopy = ref([]) as any;

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
const state = ref({
  hive: [] as any,
  type: null as any,
  disease: null as any,
  treatment_vet: null as any,
  ...stateDefault,
});

async function getEdit(id: unknown[]) {
  return await api.post(`/v1/${props.task}/batchGet`, { ids: id }).then(
    (response: any) => {
      const editIds = map(response.data, (row: any) => [
        { value: row.id, label: `ID: ${row.id} / (${row.hive.name})` },
      ]);
      editOptions.value = flatten(editIds);
      editOptionsCopy.value = flatten(editIds);
      values.value = response.data;
      //notification.open('info', t('dataLoaded'));
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
}

function onReset() {
  if (!isEdit.value) {
    merge(state.value, stateDefault);
    state.value.checkup_queen = []; // merge seems to not clear the array so we manually reset it here
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

function cleanupData() {
  let result = {
    date: state.value.date ? state.value.date : null,
    enddate: state.value.enddate ? state.value.enddate : null,
    type_id: state.value.type ? state.value.type.id : null,
    url: state.value.url ? state.value.url : null,
    note: state.value.note ? state.value.note : null,
    done: state.value.done ? state.value.done : null,
  } as any;

  if (!isEdit.value) {
    result['interval'] = state.value.interval;
    result['repeat'] = state.value.repeat;
  }

  if (props.task === 'checkup') {
    result['strong'] = state.value.checkup_strong
      ? state.value.checkup_strong
      : null;
    result['varroa'] = state.value.checkup_varroa
      ? state.value.checkup_varroa
      : null;
    result['weight'] = state.value.checkup_weight_amount
      ? state.value.checkup_weight_amount
      : null;
    result['time'] = state.value.checkup_weight_time
      ? dayjs(state.value.checkup_weight_time, 'HH:mm').format('HH:MM:ss')
      : null;
    result['temp'] = state.value.checkup_temp ? state.value.checkup_temp : null;

    result['broodframes'] = state.value.checkup_frames.broodframes
      ? state.value.checkup_frames.broodframes
      : null;
    result['emptyframes'] = state.value.checkup_frames.emptyframes
      ? state.value.checkup_frames.emptyframes
      : null;
    result['foundation'] = state.value.checkup_frames.foundation
      ? state.value.checkup_frames.foundation
      : null;
    result['honeyframes'] = state.value.checkup_frames.honeyframes
      ? state.value.checkup_frames.honeyframes
      : null;

    result['brood'] = state.value.checkup_rating.brood
      ? state.value.checkup_rating.brood
      : null;
    result['calm_comb'] = state.value.checkup_rating.calm_comb
      ? state.value.checkup_rating.calm_comb
      : null;
    result['comb'] = state.value.checkup_rating.comb
      ? state.value.checkup_rating.comb
      : null;
    result['pollen'] = state.value.checkup_rating.pollen
      ? state.value.checkup_rating.pollen
      : null;
    result['swarm'] = state.value.checkup_rating.swarm
      ? state.value.checkup_rating.swarm
      : null;
    result['temper'] = state.value.checkup_rating.temper
      ? state.value.checkup_rating.temper
      : null;
    if (state.value.checkup_queen[0]) {
      result['queen'] = includes(state.value.checkup_queen, 'queen');
      result['queencells'] = includes(state.value.checkup_queen, 'queencells');
      result['eggs'] = includes(state.value.checkup_queen, 'eggs');
      result['capped_brood'] = includes(
        state.value.checkup_queen,
        'capped_brood'
      );
    }
  } else {
    result['amount'] = state.value.amount_calc ? state.value.amount_calc : null;
    if (props.task === 'treatment') {
      result['vet_id'] = state.value.treatment_vet
        ? state.value.treatment_vet.id
        : null;
      result['wait'] = state.value.treatment_wait
        ? state.value.treatment_wait
        : null;
    } else if (props.task === 'harvest') {
      result['frames'] = state.value.harvest_amount_calc
        ? state.value.amount_calc
        : null;
      result['water'] = state.value.harvest_water
        ? state.value.harvest_water
        : null;
      result['charge'] = state.value.harvest_charge
        ? state.value.harvest_charge
        : null;
    }
  }
  return omitBy(result, isNil);
}

async function onUpdate() {
  isSubmitting.value = true;
  const isFormCorrect = await v.value.$validate();
  if (!isFormCorrect) {
    isSubmitting.value = false;
    return;
  }
  const id = editOptions.value.map((obj: any) => obj.value);
  let data = {
    ids: id,
    data: cleanupData(),
  };
  await api.patch(`/v1/${props.task}`, JSON.stringify(data)).then(
    (response: any) => {
      lastInsert.value = response.data;
      lastInsertTable.value = props.task as any;
      getEdit(id);
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
