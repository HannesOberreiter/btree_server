<template>
  <q-form class="full-width" data-cy="form-queen" @submit.prevent.stop="">
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
        name="queen"
        icon="fas fa-passport"
        class="q-mb-sm"
        :hint="isEdit ? '' : $t('lastAdded') + ': ' + lastNames"
        :max-valid="24"
      ></form-input-text>
      <div v-if="!isEdit" class="col-1 text-center">
        <btn-base
          flat
          round
          icon="fas fa-retweet"
          :color="showInterval || forceInterval ? 'secondary' : 'grey'"
          data-cy="btn-repeat"
          @click="changeInterval"
        ></btn-base>
      </div>
    </div>

    <div v-if="(showInterval || forceInterval) && !isEdit" class="col-12">
      <div class="row">
        <div class="col-12 col-md-6">
          <form-input-numeric
            v-model.number="state.start"
            label="start"
            :hint="$t('startNumberNote')"
            :max-valid="10000"
            icon="fas fa-arrow-down-1-9"
            numeric-valid="integer"
          ></form-input-numeric>
        </div>
        <div class="col-12 col-md-6">
          <form-input-numeric
            v-model.number="state.repeat"
            label="numberQueens"
            :hint="sampleName"
            :disable="forceInterval"
            shadow-text="x"
            icon="fas fa-infinity"
            :max-valid="100"
            numeric-valid="integer"
          ></form-input-numeric>
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

    <div class="col-12 q-pb-sm">
      <form-dropdown-option
        v-if="isEdit"
        v-model="state.hive"
        label="hive"
        table="hive"
        table-id="hive_id"
        :values="values"
        :reset="reset"
        filter-empty="noHive"
        :hint="$t('queenHiveInfo')"
      ></form-dropdown-option>
      <form-dropdown-hive
        v-else
        v-model="state.hive"
        :selected="selected"
        :required="false"
      ></form-dropdown-hive>
    </div>
    <div class="col-12 col-md-6 q-pt-sm q-mb-sm">
      <form-input-date
        v-model="state.move_date"
        :values="values"
        :reset="reset"
        label="queenMovedate"
        table-id="move_date"
        :hint="$t('queenMovedateInfo')"
      ></form-input-date>
    </div>

    <form-dropdown-option
      v-model="state.race"
      table="queen_races"
      label="race"
      table-id="race_id"
      :values="values"
      :reset="reset"
    ></form-dropdown-option>
    <div class="col-12 q-pb-sm">
      <form-dropdown-option
        v-model="state.mating"
        table="queen_matings"
        table-id="mating_id"
        label="mating"
        :values="values"
        :reset="reset"
      ></form-dropdown-option>
    </div>

    <div class="col-12 col-md-6 q-pt-sm">
      <form-input-text
        v-model="state.mother"
        label="mother"
        icon="fas fa-venus"
        class="q-mb-sm"
        :values="values"
        :reset="reset"
        :max-valid="24"
        :hint="$t('queenMotherInfo')"
      ></form-input-text>
    </div>

    <div class="col-12 q-pb-sm">
      <form-dropdown-option
        v-model="state.mother_id"
        :values="values"
        :reset="reset"
        label="mother"
        table="queen"
        table-id="mother_id"
        allow-empty="noMother"
      ></form-dropdown-option>
    </div>

    <form-input-url
      v-model="state.url"
      :values="values"
      :reset="reset"
    ></form-input-url>

    <form-input-note
      v-model="state.note"
      class="q-pt-sm"
      :values="values"
      :reset="reset"
    ></form-input-note>
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
        <form-input-date
          v-show="!state.modus"
          v-model="state.modusDate"
          :values="values"
          :reset="reset"
          label="modusDate"
          table-id="modus_date"
        ></form-input-date>
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
import { flatten, map, merge } from 'lodash-es';
import dayjs from 'dayjs';
import { toRefs } from '@vueuse/core';

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
import { useNotification } from '../composables/useNotification';
import useVuelidate from '@vuelidate/core';
import { useQueensQuery } from '../composables/useQuery';
import type { FormQueen } from '../types';
import { useApiFetch } from '../composables/useApi';
import { ref, computed, unref, watch } from 'vue';

import FormInputCheckbox from './FormInputCheckbox.vue';
import FormInputDate from './FormInputDate.vue';
import FormInputNote from './FormInputNote.vue';
import FormInputText from './FormInputText.vue';
import FormInputUrl from './FormInputUrl.vue';
import FormDropdownHive from './FormDropdownHive.vue';
import FormDropdownOption from './FormDropdownOption.vue';
import FormButtons from './FormButtons.vue';
import FormInputNumeric from './FormInputNumeric.vue';
import FormDropdownEdit from './FormDropdownEdit.vue';
import FormQueenMarkcolour from './FormQueenMarkcolour.vue';
import BtnBase from './BtnBase.vue';

const notification = useNotification();
const showInterval = ref(false);
const api = useApiFetch();
const forceInterval = ref(false);
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
  selected: {
    type: Array,
    default: null,
  },
  copy: {
    type: Boolean,
    default: false,
  },
});

const { ids, copy } = toRefs(props);
const isEdit = computed(() => {
  if (copy.value) return false;
  if (ids.value === null) return false;
  if (ids.value.length === 0) return false;
  return true;
});

const isCopy = computed(() => {
  if (copy.value) return true;
  return false;
});

if (isEdit.value || isCopy.value) getEdit(unref(ids.value));

const { data: queens, refetch } = useQueensQuery({
  limit: 3,
  order: ['id'],
  direction: ['desc'],
  enabled: !isEdit.value,
});
const lastNames = computed(() =>
  queens.value ? getNames(queens.value.results) : '',
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

watch(
  () => state.value.hive,
  (cur) => {
    if (isEdit.value) return;
    if (cur.length > 0) {
      state.value.repeat = cur.length;
      forceInterval.value = true;
    } else {
      forceInterval.value = false;
    }
  },
);

async function getEdit(id: unknown[]) {
  return await api.post('/v1/queen/batchGet', { ids: id }).then(
    (response: any) => {
      if (isEdit.value) {
        const editIds = map(response, (row: any) => [
          { value: row.id, label: `ID: ${row.id} / (${row.name})` },
        ]);
        editOptions.value = flatten(editIds);
        editOptionsCopy.value = [...unref(editOptions.value)];
      }
      if (isCopy.value) {
        response[0].hive_id = null;
      }
      // Little helper to set current date if user edits one entry and wants to set inactive state, otherwise it would be the creation date
      if (response.length === 1 && response[0]?.modus) {
        response[0].modus_date = dayjs().format('YYYY-MM-DD');
      }
      values.value = response;
    },
    (error) => {
      notification.open('negative', error);
    },
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
  refetch();
}
</script>
