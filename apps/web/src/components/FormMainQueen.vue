<template>
  <q-form class="full-width" @submit.prevent.stop="">
    <div class="row">
      <form-dropdown-edit
        v-if="isEdit"
        v-model="editOptions"
        class="col-12"
        :options="editOptionsCopy"
      ></form-dropdown-edit>

      <form-input-text
        v-model="state.name"
        :values="values"
        :reset="reset"
        :class="isEdit ? 'col-12' : 'col-11'"
        :required="isEdit ? false : true"
        label="name"
        icon="fas fa-passport"
        :hint="isEdit ? '' : $t('lastAdded') + ': ' + lastNames"
        :max-valid="24"
      ></form-input-text>
      <div v-if="!isEdit" class="col-1 text-center">
        <q-btn
          flat
          round
          icon="fas fa-retweet"
          :color="showInterval ? 'secondary' : 'grey'"
          @click="changeInterval"
        ></q-btn>
      </div>

      <div v-if="showInterval && !isEdit" class="col-12">
        <div class="row">
          <div class="col-6">
            <input-numeric-start
              v-model.number="state.start"
              label="start"
              :hint="$t('startNumberNote')"
              :max-valid="10000"
              icon=""
              numeric-valid="integer"
            ></input-numeric-start>
          </div>
          <div class="col-6 q-pl-sm">
            <input-numeric-repeat
              v-model.number="state.repeat"
              label="numberQueens"
              :hint="sampleName"
              shadow-text="x"
              icon=""
              :max-valid="100"
              numeric-valid="integer"
            ></input-numeric-repeat>
          </div>
        </div>
      </div>
    </div>

    <div class="col-12 col-md-6 q-pt-sm q-pb-sm">
      <form-input-date
        v-model="state.date"
        label="birth"
        table-id="date"
        :values="values"
        :reset="reset"
        icon="fas fa-cake-candles"
      ></form-input-date>
    </div>

    <div class="col-12 col-md-6">
      <form-queen-markcolour
        v-model="state.mark_colour"
        :date="state.date"
        :values="values"
        :reset="reset"
      ></form-queen-markcolour>
    </div>

    <div class="row q-pt-md q-pb-md">
      <div class="col-12 col-md-6 q-pb-md">
        <form-dropdown-option
          v-model="state.hive"
          label="hive"
          table="hive"
          table-id="hive_id"
          :values="values"
          :reset="reset"
          allow-empty="noHive"
          :hint="$t('queenHiveInfo')"
        ></form-dropdown-option>
      </div>
      <div class="col-12 col-md-6">
        <form-input-movedate
          v-model="state.move_date"
          :values="values"
          :reset="reset"
          label="queenMovedate"
          :hint="$t('queenMovedateInfo')"
        ></form-input-movedate>
      </div>
    </div>

    <form-dropdown-race
      v-model="state.race"
      table="queen_races"
      label="race"
      table-id="race_id"
      :values="values"
      :reset="reset"
    ></form-dropdown-race>
    <div class="col-12 q-pb-sm">
      <form-dropdown-mating
        v-model="state.mating"
        table="queen_matings"
        table-id="mating_id"
        label="mating"
        :values="values"
        :reset="reset"
      ></form-dropdown-mating>
    </div>

    <div class="col-12 col-md-6 q-pt-sm q-pb-sm">
      <form-input-text
        v-model="state.mother"
        label="mother"
        icon="fas fa-venus"
        :values="values"
        :reset="reset"
        :hint="$t('queenMotherInfo')"
      ></form-input-text>
    </div>

    <div class="col-12 q-pb-sm">
      <form-dropdown-mother
        v-model="state.mother_id"
        label="mother"
        table="queen"
        table-id="mother_id"
        allow-empty="noMother"
      ></form-dropdown-mother>
    </div>

    <form-input-url
      v-model="state.url"
      :values="values"
      :reset="reset"
    ></form-input-url>

    <input-note
      v-model="state.note"
      class="q-pt-sm"
      :values="values"
      :reset="reset"
    ></input-note>
    <div class="row q-pt-sm q-pb-md">
      <div class="col-12 col-md-6">
        <form-input-checkbox
          v-model="state.modus"
          label="modus"
          status-active="active"
          status-inactive="inactive"
          :values="values"
          :reset="reset"
        ></form-input-checkbox>
      </div>
      <div class="col-12 col-md-6">
        <form-input-modusdate
          v-if="!state.modus"
          v-model="state.modusDate"
          :values="values"
          :reset="reset"
          label="modusDate"
        ></form-input-modusdate>
      </div>
    </div>
  </q-form>

  <form-buttons
    :state="state"
    :is-edit="isEdit"
    :edit-ids="editOptions"
    :v="v"
    form="queen"
    @reset="onReset"
    @change="onChange"
  ></form-buttons>
</template>

<script lang="ts">
import { flatten, map, merge } from 'lodash';
import dayjs from 'dayjs';

function getNames(v: any) {
  return v.map((o: any) => o.name).join(', ');
}
const stateDefault = {
  name: '',
  date: dayjs().format('YYYY-MM-DD'),
  mark_colour: '',
  move_date: dayjs().format('YYYY-MM-DD'),
  mother: '',
  note: '',
  url: '',
  modus: true,
  modusDate: dayjs().format('YYYY-MM-DD'),
};
</script>

<script setup lang="ts">
import { api } from '~/boot/axios';
import { useNotification } from '~/composables/useResponseText';
import FormInputMovedate from './FormInputDate.vue';
import FormInputModusdate from './FormInputDate.vue';
import FormInputCheckbox from './FormInputCheckbox.vue';
import FormDropdownMating from './FormDropdownOption.vue';
import FormDropdownRace from './FormDropdownOption.vue';
import FormInputText from './FormInputText.vue';
import InputNote from './FormInputNote.vue';
import InputNumericStart from './FormInputNumeric.vue';
import InputNumericRepeat from './FormInputNumeric.vue';
import useVuelidate from '@vuelidate/core';
import { useQueensQuery } from '~/composables/useQuery';
import FormDropdownEdit from './FormDropdownEdit.vue';
import FormButtons from './FormButtons.vue';
import FormDropdownOption from './FormDropdownOption.vue';
import FormDropdownMother from './FormDropdownOption.vue';
import FormInputDate from './FormInputDate.vue';
import FormQueenMarkcolour from './FormQueenMarkcolour.vue';
import FormInputUrl from './FormInputUrl.vue';
import { FormQueen } from '~/types';

const notification = useNotification();
const showInterval = ref(false);
const values = ref({});
const reset = ref(0);
const editOptions = ref([]) as any;
const editOptionsCopy = ref([]) as any;
const emit = defineEmits(['onSuccess']);
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

const { data: queens, refetch } = useQueensQuery({
  limit: 3,
  order: ['id'],
  direction: ['desc'],
  enabled: !isEdit.value,
});
const lastNames = computed(() =>
  queens.value ? getNames(queens.value.results) : ''
);
const sampleName = computed(() => {
  let hintText = '';
  if (state.value.name !== '' && state.value.repeat > 0) {
    for (let i = 0; i < state.value.repeat; i++) {
      hintText += state.value.name + (state.value.start + i) + ' ';
      if (i > 2) {
        hintText += '...';
        break;
      }
    }
  }
  return hintText;
});

const state = ref<FormQueen>({
  start: 0,
  repeat: 0,
  hive: undefined as any,
  mating: undefined as any,
  race: undefined as any,
  mother_id: undefined as any,
  ...stateDefault,
});
const rules = {};
const v = useVuelidate(rules, state, { $autoDirty: true });

async function getEdit(id: unknown[]) {
  return await api.post('/v1/queen/batchGet', { ids: id }).then(
    (response: any) => {
      const editIds = map(response.data, (row: any) => [
        { value: row.id, label: `ID: ${row.id} / (${row.name})` },
      ]);
      editOptions.value = flatten(editIds);
      editOptionsCopy.value = [...unref(editOptions.value)];
      values.value = response.data;
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
}

function changeInterval() {
  showInterval.value = !showInterval.value;
}

function onReset() {
  if (!isEdit.value) {
    merge(state.value, stateDefault);
  }
  if (showInterval.value) changeInterval();
  reset.value++;
  notification.open('info', 'successReset');
}

async function onChange() {
  emit('onSuccess', true);
  refetch.value();
}
</script>
