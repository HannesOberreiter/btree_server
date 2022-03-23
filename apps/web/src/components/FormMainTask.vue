<template>
  <form-common-hive v-model="state.hive"></form-common-hive>
  <div class="q-pt-xs">
    <form-common-dates
      v-model:start-value="state.date"
      v-model:end-value="state.enddate"
      v-model:model-interval="state.interval"
      v-model:model-repeat="state.repeat"
    ></form-common-dates>
  </div>
  <div class="q-mb-sm q-mt-sm">
    <!-- Main Dropdowns -->
    <div v-if="task === 'checkup'">
      <form-common-dropdown
        v-if="task === 'checkup'"
        v-model="state.type"
        table="checkup_types"
      ></form-common-dropdown>
    </div>
    <div v-else-if="task === 'harvest'" class="row">
      <div class="col-12 q-pb-sm">
        <form-common-dropdown
          v-model="state.type"
          table="harvest_types"
        ></form-common-dropdown>
      </div>
    </div>
    <div v-else-if="task === 'treatment'" class="row">
      <div class="col-12 col-md-6 q-pb-sm">
        <form-common-dropdown
          v-model="state.type"
          table="treatment_types"
        ></form-common-dropdown>
      </div>
      <div class="col-12 col-md-6 q-pb-sm">
        <form-common-dropdown-disease
          v-model="state.disease"
          table="treatment_diseases"
          label="disease"
        ></form-common-dropdown-disease>
      </div>
    </div>
    <div v-else-if="task === 'feed'" class="row">
      <div class="col-12 q-pb-sm">
        <form-common-dropdown
          v-model="state.type"
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
        ></form-common-amount>
      </div>
    </div>
    <!-- Additional optional fields -->
    <div v-if="task === 'checkup'">
      <form-checkup-queen
        v-if="fields.settings.checkup.queen"
        v-model="state.checkup_queen"
      ></form-checkup-queen>
      <form-checkup-rating
        v-if="fields.settings.checkup.rating"
        v-model="state.checkup_rating"
      ></form-checkup-rating>
      <form-checkup-frames
        v-if="fields.settings.checkup.frames"
        v-model="state.checkup_frames"
      ></form-checkup-frames>
      <div class="row q-pt-sm q-pb-sm">
        <div class="col-12 col-md-7">
          <form-checkup-varroa
            v-if="fields.settings.checkup.varroa"
            v-model="state.checkup_varroa"
          ></form-checkup-varroa>
        </div>
      </div>
      <div v-if="fields.settings.checkup.strength" class="row q-pt-sm q-pb-sm">
        <div class="col-12 col-md-6">
          <form-checkup-strength
            v-model="state.checkup_strong"
          ></form-checkup-strength>
        </div>
      </div>
      <div v-if="fields.settings.checkup.weight" class="q-pt-sm q-pb-sm">
        <form-checkup-weight
          v-model="state.checkup_weight_amount"
          v-model:model-time="state.checkup_weight_time"
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
            :hive-count="state.hive.length"
            label="frame"
          ></form-common-amount-frames>
        </div>
      </div>
      <div v-if="fields.settings.harvest.water" class="row">
        <div class="col-12 col-md-6">
          <form-harvest-water
            v-model="state.harvest_water"
          ></form-harvest-water>
        </div>
      </div>
      <div class="row">
        <div class="col-12 col-md-6">
          <form-common-charge
            v-model="state.harvest_charge"
          ></form-common-charge>
        </div>
      </div>
    </div>
    <div v-else-if="task === 'treatment'" class="row">
      <div v-if="fields.settings.treatment.vet" class="col-12 q-pb-sm">
        <form-common-dropdown-vet
          v-model="state.treatment_vet"
          table="treatment_vets"
          label="vet"
        ></form-common-dropdown-vet>
      </div>
      <div
        v-if="fields.settings.treatment.wait"
        class="col-12 col-md-6 q-pb-sm"
      >
        <form-treatment-wait
          v-model="state.treatment_wait"
        ></form-treatment-wait>
      </div>
    </div>
  </div>
  <form-common-url v-model="state.url"></form-common-url>
  <form-common-note v-model="state.note"></form-common-note>
  <form-common-done v-model="state.done"></form-common-done>

  <q-btn-group>
    <q-btn @click="onSubmit">{{ t('save') }}</q-btn>
    <q-btn @click="onReset">{{ t('reset') }}</q-btn>
    <q-btn v-if="lastInsert" @click="onUndo">{{ t('undo') }}</q-btn>
  </q-btn-group>
</template>

<script setup lang="ts">
import { PropType, ref } from 'vue';
import { Task } from '~/types';
import { useFieldsettingStore } from '~/stores/fieldsetting';
import { useI18n } from 'vue-i18n';
import { merge } from 'lodash';
import dayjs from 'dayjs';
import FormCheckupFrames from './FormCheckupFrames.vue';
import FormCheckupQueen from './FormCheckupQueen.vue';
import FormCheckupRating from './FormCheckupRating.vue';
import FormCheckupStrength from './FormCheckupStrength.vue';
import FormCheckupTemperature from './FormCheckupTemperature.vue';
import FormCheckupVarroa from './FormCheckupVarroa.vue';
import FormCheckupWeight from './FormCheckupWeight.vue';
import FormCommonAmount from './FormCommonAmount.vue';
import FormCommonAmountFrames from './FormCommonAmount.vue';
import FormCommonCharge from './FormCommonCharge.vue';
import FormCommonDates from '~/components/FormCommonDates.vue';
import FormCommonDone from './FormCommonDone.vue';
import FormCommonDropdown from '~/components/FormCommonDropdown.vue';
import FormCommonDropdownDisease from '~/components/FormCommonDropdown.vue';
import FormCommonDropdownVet from '~/components/FormCommonDropdown.vue';
import FormCommonHive from '~/components/FormCommonHive.vue';
import FormCommonNote from '~/components/FormCommonNote.vue';
import FormCommonUrl from '~/components/FormCommonUrl.vue';
import FormHarvestWater from './FormHarvestWater.vue';
import FormTreatmentWait from './FormTreatmentWait.vue';
import useVuelidate from '@vuelidate/core';
import { api } from '~/boot/axios';
import { useNotification } from '~/composables/useResponseText';

const fields = useFieldsettingStore();
const { t } = useI18n();
const isSubmitting = ref(false);
const v = useVuelidate();
const notification = useNotification();
const lastInsert = ref(null);
const lastInsertTable = ref(null);
const props = defineProps({
  task: {
    type: String as PropType<Task>,
    required: true,
  },
});

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

  checkup_queen: [],
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
  date: dayjs().format('YYYY-MM-DD'),
  enddate: dayjs().format('YYYY-MM-DD'),
  interval: 0,
  repeat: 0,
  hive: [] as any,
  type: null as any,
  disease: null as any,
  amount: 0,
  amount_type: 'single',
  amount_calc: 0,
  url: '',
  note: '',
  done: true,

  checkup_queen: [],
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

  treatment_vet: null as any,
  treatment_wait: 0,
});

function onReset() {
  merge(state.value, stateDefault);
  state.value.checkup_queen = []; // merge seems to not clear the array so we manually reset it here
}

async function onUndo() {
  isSubmitting.value = true;
  const data = JSON.stringify({ ids: lastInsert.value });
  await api.patch(`/v1/${lastInsertTable.value}/batchDelete`, data).then(
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
