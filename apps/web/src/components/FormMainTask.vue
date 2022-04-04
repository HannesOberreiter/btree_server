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
          table-id="disease_id"
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

<script lang="ts">
import { flatten, includes, isNil, map, merge, omitBy } from 'lodash';
import dayjs from 'dayjs';
import { Task } from '~/types';

interface State {
  date: string;
  enddate: string;
  interval: number;
  repeat: number;
  amount: number;
  amount_type: string;
  amount_calc: number;
  url: string;
  note: string;
  done: boolean;
  checkup_queen: any;
  checkup_rating: {
    brood: number;
    pollen: number;
    comb: number;
    temper: number;
    calm_comb: number;
    swarm: number;
  };
  checkup_frames: {
    broodframes: number;
    honeyframes: number;
    foundation: number;
    emptyframes: number;
  };
  checkup_varroa: number;
  checkup_strong: number;
  checkup_weight_amount: number;
  checkup_weight_time: string;
  checkup_temp: number;
  harvest_frames: number;
  harvest_amount_type: string;
  harvest_amount_calc: number;
  harvest_water: number;
  harvest_charge: string;
  treatment_wait: number;
  hive: any;
  type: any;
  disease: any;
  treatment_vet: any;
}

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

function cleanupData(state: State, task: Task, isEdit: boolean) {
  let result = {
    date: state.date,
    enddate: state.enddate,
    type_id: state.type ? state.type.id : null,
    url: state.url,
    note: state.note,
    done: state.done,
  } as any;

  if (!isEdit) {
    result['hive_ids'] = state.hive.map((obj: any) => obj.id);
    result['interval'] = state.interval ? state.interval : 0;
    result['repeat'] = state.repeat ? state.repeat : 0;
  }

  if (task === 'checkup') {
    result['strong'] = state.checkup_strong;
    result['varroa'] = state.checkup_varroa;
    result['weight'] = state.checkup_weight_amount;
    result['time'] = state.checkup_weight_time
      ? dayjs(state.checkup_weight_time, 'HH:mm').format('HH:MM:ss')
      : null;
    result['temp'] = state.checkup_temp;

    result['broodframes'] = state.checkup_frames.broodframes;
    result['emptyframes'] = state.checkup_frames.emptyframes;
    result['foundation'] = state.checkup_frames.foundation;
    result['honeyframes'] = state.checkup_frames.honeyframes;

    result['brood'] = state.checkup_rating.brood;
    result['calm_comb'] = state.checkup_rating.calm_comb;
    result['comb'] = state.checkup_rating.comb;
    result['pollen'] = state.checkup_rating.pollen;
    result['swarm'] = state.checkup_rating.swarm;
    result['temper'] = state.checkup_rating.temper;
    if (state.checkup_queen[0]) {
      result['queen'] = includes(state.checkup_queen, 'queen');
      result['queencells'] = includes(state.checkup_queen, 'queencells');
      result['eggs'] = includes(state.checkup_queen, 'eggs');
      result['capped_brood'] = includes(state.checkup_queen, 'capped_brood');
    }
  } else {
    result['amount'] = state.amount_calc;

    if (task === 'treatment') {
      result['vet_id'] = state.treatment_vet ? state.treatment_vet.id : null;
      result['wait'] = state.treatment_wait;
    } else if (task === 'harvest') {
      result['frames'] = state.harvest_amount_calc;
      result['water'] = state.harvest_water;
      result['charge'] = state.harvest_charge;
    }
  }
  return omitBy(result, isNil);
}
</script>

<script setup lang="ts">
import { api } from '~/boot/axios';
import { PropType } from 'vue';
import useVuelidate from '@vuelidate/core';
import { useNotification } from '~/composables/useResponseText';
import { useFieldsettingStore } from '~/stores/fieldsetting';

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
if (!isEdit.value && router.currentRoute.value.name === 'edit-quicktool')
  router.push({ name: 'new-quicktool' });

const editOptions = ref([]) as any;
const editOptionsCopy = ref([]) as any;

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
  reset.value++;
  notification.open('positive', t('successReset'));
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
  const id = editOptions.value.map((obj: any) => obj.value);
  let data = {
    ids: id,
    data: cleanupData(state.value, props.task, isEdit.value),
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
  const data = cleanupData(state.value, props.task, false);
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
