<template>
  <q-form data-cy="form-quicktool" class="full-width" @submit.prevent.stop="">
    <form-dropdown-edit
      v-if="isEdit"
      v-model="editOptions"
      :options="editOptionsCopy"
    ></form-dropdown-edit>
    <form-dropdown-hive
      v-else
      v-model="state.hive"
      :form-event="formEvent"
    ></form-dropdown-hive>

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
    <div class="q-mb-sm">
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
          <form-dropdown-option
            v-model="state.treatment_disease"
            :values="values"
            :reset="reset"
            table="treatment_diseases"
            label="disease"
            table-id="disease_id"
          ></form-dropdown-option>
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
          v-if="fields.settings.checkup.queen || fields.someCheckboxTrue"
          v-model="state.checkup_queen"
          :values="values"
          :reset="reset"
        ></form-checkup-queen>
        <form-checkup-rating
          v-if="fields.settings.checkup.rating || fields.someRatingTrue"
          v-model="state.checkup_rating"
          :reset="reset"
          :values="values"
        ></form-checkup-rating>
        <form-checkup-frames
          v-if="fields.settings.checkup.frames || fields.someFrameTrue"
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
              :hive="state.hive"
            ></form-checkup-varroa>
          </div>
        </div>
        <div
          v-if="fields.settings.checkup.strength"
          class="row q-pt-sm q-pb-sm"
        >
          <div class="col-12 col-md-6">
            <form-input-numeric
              v-model="state.checkup_strong"
              :values="values"
              :reset="reset"
              label="strong"
              icon="fas fa-dumbbell"
            >
            </form-input-numeric>
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
              v-model="state.checkup_temperature"
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
            <form-input-amount
              v-model="state.harvest_frames"
              v-model:model-type="state.harvest_amount_type"
              v-model:model-calc="state.harvest_amount_calc"
              :reset="reset"
              :values="values"
              :hive-count="state.hive.length"
              label="frame"
              table-id="frames"
            ></form-input-amount>
          </div>
        </div>
        <div v-if="fields.settings.harvest.water" class="row">
          <div class="col-12 col-md-6">
            <form-input-numeric
              v-model="state.harvest_water"
              :values="values"
              :reset="reset"
              label="water"
              icon="fas fa-droplet"
              shadow-text="%"
            ></form-input-numeric>
          </div>
        </div>
        <div class="row">
          <div class="col-12 col-md-6">
            <form-input-text
              v-model="state.harvest_charge"
              label="charge"
              icon="fas fa-receipt"
              :values="values"
              :reset="reset"
            ></form-input-text>
          </div>
        </div>
      </div>
      <div v-else-if="task === 'treatment'" class="row">
        <div v-if="fields.settings.treatment.vet" class="col-12 q-pb-sm">
          <form-dropdown-option
            v-model="state.treatment_vet"
            :values="values"
            :reset="reset"
            table-id="vet_id"
            table="treatment_vets"
            label="vet"
          ></form-dropdown-option>
        </div>
        <div v-if="fields.settings.treatment.wait" class="col-12 col-md-6">
          <form-input-numeric
            v-model="state.treatment_wait"
            :values="values"
            :reset="reset"
            label="waitTime"
            :shadow-text="$t('day', 2)"
            icon="fas fa-circle-pause"
            :max-valid="365"
          ></form-input-numeric>
        </div>
        <div
          v-if="fields.settings.treatment.temperature"
          class="col-12 col-md-7"
        >
          <form-checkup-temperature
            v-model="state.treatment_temperature"
            :hive="state.hive"
            :reset="reset"
            :values="values"
          ></form-checkup-temperature>
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
  </q-form>

  <form-buttons
    :state="state"
    :is-edit="isEdit"
    :edit-ids="editOptions"
    :v="v"
    :form="props.task"
    @reset="onReset"
    @change="(val: 'update' | 'insert') => onChange(val)"
  ></form-buttons>
</template>

<script lang="ts">
import { flatten, map, merge } from 'lodash-es';
import * as dayjs from 'dayjs';
import { Task } from '~/types';

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
  checkup_temperature: 0,

  harvest_frames: 0,
  harvest_amount_type: 'single',
  harvest_amount_calc: 0,
  harvest_water: 0,
  harvest_charge: '',

  treatment_wait: 0,
  treatment_temperature: 0,
};
</script>

<script setup lang="ts">
import { PropType, ref, computed, unref } from 'vue';
import useVuelidate from '@vuelidate/core';
import { useNotification } from '~/composables/useNotification';
import { useFieldsettingStore } from '~/stores/fieldsetting';
import { useApiFetch } from '~/composables/useApi';
import FormButtons from '~/components/FormButtons.vue';
import FormInputText from '~/components/FormInputText.vue';
import FormInputNumeric from '~/components/FormInputNumeric.vue';
import FormInputAmount from '~/components/FormInputAmount.vue';
import FormInputUrl from '~/components/FormInputUrl.vue';
import FormInputNote from '~/components/FormInputNote.vue';
import FormInputCheckbox from '~/components/FormInputCheckbox.vue';
import FormDropdownOption from '~/components/FormDropdownOption.vue';
import FormCheckupTemperature from '~/components/FormCheckupTemperature.vue';
import FormCheckupFrames from '~/components/FormCheckupFrames.vue';
import FormCheckupRating from '~/components/FormCheckupRating.vue';
import FormCheckupQueen from '~/components/FormCheckupQueen.vue';
import FormDropdownHive from '~/components/FormDropdownHive.vue';
import FormDropdownEdit from '~/components/FormDropdownEdit.vue';
import FormCheckupWeight from '~/components/FormCheckupWeight.vue';
import FormCheckupVarroa from './FormCheckupVarroa.vue';
import FormInputDates from './FormInputDates.vue';
import { useRouter } from 'vue-router';

const fields = useFieldsettingStore();
const notification = useNotification();

const v = useVuelidate();
const api = useApiFetch();
const router = useRouter();
const values = ref({});
const reset = ref(0);
const formEvent = ref<string>('');

const emit = defineEmits(['onSuccess']);
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
  treatment_disease: null as any,
  treatment_vet: null as any,
  ...stateDefault,
});

async function getEdit(id: unknown[]) {
  return await api.post(`/v1/${props.task}/batchGet`, { ids: id }).then(
    (response: any) => {
      const editIds = map(response, (row: any) => [
        { value: row.id, label: `ID: ${row.id} / (${row.hive.name})` },
      ]);
      editOptions.value = flatten(editIds);
      editOptionsCopy.value = flatten(editIds);
      values.value = response;
    },
    (error) => {
      notification.open('negative', error);
    }
  );
}

function onReset() {
  if (!isEdit.value) {
    merge(state.value, stateDefault);
    state.value.checkup_queen = []; // merge seems to not clear the array so we manually reset it here
  }
  reset.value++;
  notification.open('positive', 'successReset');
}

function onChange(type: 'update' | 'insert' = 'update') {
  formEvent.value = type;
  emit('onSuccess', true);
}
</script>
