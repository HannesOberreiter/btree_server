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
              label="numberHives"
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

    <div v-if="!isEdit" class="row q-pt-md q-pb-md">
      <div class="col-12 col-md-6">
        <form-dropdown-option
          v-model="state.apiary"
          label="apiary"
          table="apiary"
          table-id="apiary_id"
        ></form-dropdown-option>
      </div>
      <div class="col-12 col-md-6">
        <form-input-movedate
          v-model="state.date"
          label="movedate"
          :hint="$t('movementInfo')"
        ></form-input-movedate>
      </div>
    </div>

    <form-dropdown-type
      v-model="state.type"
      table="hive_types"
      label="type"
      :values="values"
      :reset="reset"
    ></form-dropdown-type>
    <div class="col-12 q-pb-sm">
      <form-dropdown-source
        v-model="state.source"
        table="hive_sources"
        table-id="source_id"
        label="source"
        :values="values"
        :reset="reset"
      ></form-dropdown-source>
    </div>

    <div class="col-12 col-md-6 q-pt-sm q-pb-sm">
      <input-numeric-position
        v-model="state.position"
        label="position"
        :hint="$t('positionNote')"
        icon="fas fa-arrow-down-1-9"
        numeric-valid="integer"
        :values="values"
        :reset="reset"
      >
      </input-numeric-position>
    </div>
    <div class="col-12 col-md-6 q-pt-sm q-pb-sm">
      <input-numeric-grouphive
        v-model="state.grouphive"
        label="grouphive"
        :hint="$t('grouphiveNote')"
        icon="fas fa-city"
        numeric-valid="integer"
        :values="values"
        :reset="reset"
      ></input-numeric-grouphive>
    </div>

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
    form="hive"
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
  position: 0,
  grouphive: 0,
  note: '',
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
import FormDropdownSource from './FormDropdownOption.vue';
import FormDropdownType from './FormDropdownOption.vue';
import FormInputText from './FormInputText.vue';
import InputNote from './FormInputNote.vue';
import InputNumericStart from './FormInputNumeric.vue';
import InputNumericRepeat from './FormInputNumeric.vue';
import InputNumericGrouphive from './FormInputNumeric.vue';
import InputNumericPosition from './FormInputNumeric.vue';
import useVuelidate from '@vuelidate/core';
import { useHivesQuery } from '~/composables/useQuery';
import FormDropdownEdit from './FormDropdownEdit.vue';
import FormButtons from './FormButtons.vue';
import { FormHive } from '~/types';
import FormDropdownOption from './FormDropdownOption.vue';

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

const { data: hives, refetch } = useHivesQuery({
  limit: 3,
  order: ['id'],
  direction: ['desc'],
  enabled: !isEdit.value,
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
