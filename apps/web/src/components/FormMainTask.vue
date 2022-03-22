<template>
  <form-common-hive v-model="state.hive"></form-common-hive>
  <form-common-dates
    v-model:start-value="state.date"
    v-model:end-value="state.enddate"
  ></form-common-dates>
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
      <div class="col-12 col-md-6 q-pt-sm">
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
      ></form-checkup-queen>
      <form-checkup-rating
        v-if="fields.settings.checkup.rating"
      ></form-checkup-rating>
      <form-checkup-frames
        v-if="fields.settings.checkup.frames"
      ></form-checkup-frames>
      <div class="row q-pt-sm q-pb-sm">
        <div class="col-12 col-md-6">
          <form-checkup-varroa
            v-if="fields.settings.checkup.varroa"
          ></form-checkup-varroa>
        </div>
      </div>
      <div v-if="fields.settings.checkup.strength" class="row q-pt-sm q-pb-sm">
        <div class="col-12 col-md-6">
          <form-checkup-strength></form-checkup-strength>
        </div>
      </div>
      <div v-if="fields.settings.checkup.weight" class="q-pt-sm q-pb-sm">
        <form-checkup-weight></form-checkup-weight>
      </div>
      <div
        v-if="fields.settings.checkup.temperature"
        class="row q-pt-sm q-pb-sm"
      >
        <div class="col-12 col-md-6">
          <form-checkup-temperature
            :hive="state.hive"
          ></form-checkup-temperature>
        </div>
      </div>
    </div>
    <div v-else-if="task === 'harvest'" class="row">
      <div v-if="fields.settings.harvest.frames" class="col-12 col-md-6">
        <form-common-amount-frames
          :hive-count="state.hive.length"
          label="frame"
        ></form-common-amount-frames>
      </div>
      <div v-if="fields.settings.harvest.water" class="col-12 col-md-6">
        <form-harvest-water></form-harvest-water>
      </div>
      <div class="col-12 col-md-6">
        <form-common-charge></form-common-charge>
      </div>
    </div>
    <div v-else-if="task === 'treatment'" class="row">
      <div v-if="fields.settings.treatment.vet" class="col-12 q-pb-sm">
        <form-common-dropdown-vet
          table="treatment_vets"
          label="vet"
        ></form-common-dropdown-vet>
      </div>
      <div
        v-if="fields.settings.treatment.wait"
        class="col-12 col-md-5 q-pb-sm"
      >
        <form-treatment-wait></form-treatment-wait>
      </div>
    </div>
  </div>
  <form-common-url></form-common-url>
  <form-common-note></form-common-note>
  <form-common-done></form-common-done>

  <q-btn-group>
    <q-btn @click="onSubmit">{{ t('save') }}</q-btn>
    <q-btn>{{ t('reset') }}</q-btn>
  </q-btn-group>
</template>

<script setup lang="ts">
import { PropType, ref } from 'vue';
import { Task } from '~/types';
import { useI18n } from 'vue-i18n';
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
import { useFieldsettingStore } from '~/stores/fieldsetting';
import dayjs from 'dayjs';

const fields = useFieldsettingStore();

const props = defineProps({
  task: {
    type: String as PropType<Task>,
    required: true,
  },
});

const state = ref({
  date: dayjs().format('YYYY-MM-DD'),
  enddate: dayjs().format('YYYY-MM-DD'),
  hive: [],
  type: null,
  disease: null,
  amount: 0,
  amount_type: 'single',
  amount_calc: 0,
});

const { t } = useI18n();
console.log(props.task);

function onSubmit() {
  console.log(state.value);
  console.log(state.value.amount);
  console.log(state.value.amount_type);
}
</script>
