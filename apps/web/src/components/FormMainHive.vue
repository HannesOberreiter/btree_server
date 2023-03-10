<template>
  <q-form class="full-width" data-cy="form-hive" @submit.prevent.stop="">
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
        name="hive"
        icon="fas fa-passport"
        :hint="isEdit ? '' : $t('lastAdded') + ': ' + lastNames"
        :max-valid="24"
      ></form-input-text>
      <div v-if="!isEdit" class="col-1 text-center">
        <btn-base
          flat
          round
          icon="fas fa-retweet"
          :color="showInterval ? 'secondary' : 'grey'"
          data-cy="btn-repeat"
          @click="changeInterval"
        ></btn-base>
      </div>

      <div v-if="showInterval && !isEdit" class="col-12">
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
              label="numberHives"
              :hint="sampleName"
              shadow-text="x"
              icon="fas fa-infinity"
              :max-valid="100"
              numeric-valid="integer"
            ></form-input-numeric>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!isEdit" class="row q-pb-md">
      <div class="col-12 col-md-6">
        <form-dropdown-option
          v-model="state.apiary"
          label="apiary"
          table="apiary"
          table-id="apiary_id"
        ></form-dropdown-option>
      </div>
      <div class="col-12 col-md-6">
        <form-input-date
          v-model="state.date"
          label="movedate"
          :hint="$t('movementInfo')"
        ></form-input-date>
      </div>
    </div>

    <form-dropdown-option
      v-model="state.type"
      table="hive_types"
      label="type"
      :values="values"
      :reset="reset"
    ></form-dropdown-option>
    <div class="col-12 q-pb-sm">
      <form-dropdown-option
        v-model="state.source"
        table="hive_sources"
        table-id="source_id"
        label="status"
        :values="values"
        :reset="reset"
      ></form-dropdown-option>
    </div>

    <div class="col-12 col-md-6 q-pt-sm q-pb-sm">
      <form-input-numeric
        v-model="state.position"
        label="position"
        :hint="$t('positionNote')"
        icon="fas fa-arrow-down-1-9"
        numeric-valid="integer"
        :values="values"
        :reset="reset"
      >
      </form-input-numeric>
    </div>
    <div class="col-12 col-md-6 q-pt-sm q-pb-sm">
      <form-input-numeric
        v-model="state.grouphive"
        label="grouphive"
        :hint="$t('grouphiveNote')"
        icon="fas fa-city"
        numeric-valid="integer"
        :values="values"
        :reset="reset"
      ></form-input-numeric>
    </div>

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
    form="hive"
    @reset="onReset"
    @change="onChange"
  ></form-buttons>
</template>

<script lang="ts">
import { flatten, map, merge } from 'lodash-es';
import * as dayjs from 'dayjs';
import { ref, computed, unref } from 'vue';

import FormButtons from './FormButtons.vue';
import FormDropdownOption from './FormDropdownOption.vue';
import FormInputCheckbox from './FormInputCheckbox.vue';
import FormInputDate from './FormInputDate.vue';
import FormInputNote from './FormInputNote.vue';
import FormInputNumeric from './FormInputNumeric.vue';
import FormInputText from './FormInputText.vue';
import FormDropdownEdit from './FormDropdownEdit.vue';

function getNames(v: any) {
  return v.map((o: any) => o.name).join(', ');
}
const stateDefault = {
  name: '',
  date: dayjs().format('YYYY-MM-DD'),
  position: 0,
  grouphive: 0,
  note: '',
  modus: true,
  modusDate: dayjs().format('YYYY-MM-DD'),
};
</script>

<script setup lang="ts">
import { useNotification } from '~/composables/useNotification';
import useVuelidate from '@vuelidate/core';
import { useHivesQuery } from '~/composables/useQuery';
import { FormHive } from '~/types';
import { useApiFetch } from '~/composables/useApi';

const notification = useNotification();
const showInterval = ref(false);
const api = useApiFetch();
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

const { data: hives, refetch } = useHivesQuery({
  limit: 3,
  order: ['id'],
  direction: ['desc'],
  enabled: !isEdit.value,
  modus: null,
});
const lastNames = computed(() =>
  hives.value ? getNames(hives.value.results) : ''
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

const state = ref<FormHive>({
  start: 0,
  repeat: 0,
  apiary: undefined as any,
  type: undefined as any,
  source: undefined as any,
  ...stateDefault,
});
const rules = {};
const v = useVuelidate(rules, state, { $autoDirty: true });

async function getEdit(id: unknown[]) {
  return await api.post('/v1/hive/batchGet', { ids: id }).then(
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
