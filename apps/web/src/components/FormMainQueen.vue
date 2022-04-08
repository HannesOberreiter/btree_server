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
          :color="showInterval || forceInterval ? 'secondary' : 'grey'"
          @click="changeInterval"
        ></q-btn>
      </div>

      <div v-if="(showInterval || forceInterval) && !isEdit" class="col-12">
        <div class="row">
          <div class="col-6">
            <form-input-numeric
              v-model.number="state.start"
              label="start"
              :hint="$t('startNumberNote')"
              :max-valid="10000"
              icon="fas fa-arrow-down-1-9"
              numeric-valid="integer"
            ></form-input-numeric>
          </div>
          <div class="col-6 q-pl-sm">
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
        allow-empty="noHive"
        :hint="$t('queenHiveInfo')"
      ></form-dropdown-option>
      <form-dropdown-hive
        v-else
        v-model="state.hive"
        :selected="selected"
        :required="false"
      ></form-dropdown-hive>
    </div>
    <div class="col-12 col-md-6 q-pt-sm">
      <form-input-date
        v-model="state.move_date"
        :values="values"
        :reset="reset"
        label="queenMovedate"
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
      <form-dropdown-option
        v-model="state.mother_id"
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
          v-if="!state.modus"
          v-model="state.modusDate"
          :values="values"
          :reset="reset"
          label="modusDate"
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
import { useNotification } from '~/composables/useResponseText';
import FormInputDate from './FormInputDate.vue';
import FormInputCheckbox from './FormInputCheckbox.vue';
import FormDropdownOption from './FormDropdownOption.vue';
import FormInputText from './FormInputText.vue';
import FormInputNote from './FormInputNote.vue';
import FormInputNumeric from './FormInputNumeric.vue';
import FormDropdownHive from './FormDropdownHive.vue';
import FormDropdownEdit from './FormDropdownEdit.vue';
import FormQueenMarkcolour from './FormQueenMarkcolour.vue';
import FormInputUrl from './FormInputUrl.vue';
import FormButtons from './FormButtons.vue';
import useVuelidate from '@vuelidate/core';
import { useQueensQuery } from '~/composables/useQuery';
import { FormQueen } from '~/types';
import { useApiFetch } from '~/composables/useApi';

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

watch(
  () => state.value.hive,
  (cur) => {
    if (isEdit.value) return;
    console.log(cur.length);
    if (cur.length > 0) {
      state.value.repeat = cur.length;
      forceInterval.value = true;
    } else {
      forceInterval.value = false;
    }
  }
);

async function getEdit(id: unknown[]) {
  return await api.post('/v1/queen/batchGet', { ids: id }).then(
    (response: any) => {
      const editIds = map(response, (row: any) => [
        { value: row.id, label: `ID: ${row.id} / (${row.name})` },
      ]);
      editOptions.value = flatten(editIds);
      editOptionsCopy.value = [...unref(editOptions.value)];
      values.value = response;
    },
    (error) => {
      notification.open('negative', error);
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
