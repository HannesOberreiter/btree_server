<template>
  <q-form class="full-width" @submit.prevent.stop="onSubmit">
    <div class="row">
      <form-common-name
        v-model="state.name"
        class="col-11"
        :hint="$t('lastAdded') + ': ' + lastNames"
      ></form-common-name>
      <div class="col-1 text-center">
        <q-btn
          flat
          round
          icon="fas fa-retweet"
          :color="showInterval ? 'secondary' : 'grey'"
          @click="changeInterval"
        ></q-btn>
      </div>

      <div v-if="showInterval" class="col-12">
        <div v-if="showInterval" class="row">
          <div class="col-6">
            <form-common-numeric-start
              v-model.number="state.start"
              label="start"
              :hint="$t('startNumberNote')"
              :max-valid="10000"
              icon=""
              numeric-valid="integer"
            ></form-common-numeric-start>
          </div>
          <div class="col-6 q-pl-sm">
            <form-common-numeric-repeat
              v-model.number="state.repeat"
              label="numberHives"
              :hint="sampleName"
              shadow-text="x"
              icon=""
              :max-valid="100"
              numeric-valid="integer"
            ></form-common-numeric-repeat>
          </div>
        </div>
      </div>
    </div>

    <div class="row q-pt-md q-pb-md">
      <div class="col-12 col-md-6">
        <form-common-dropdown-apiary
          v-model="state.apiary"
        ></form-common-dropdown-apiary>
      </div>
      <div class="col-12 col-md-6">
        <form-common-date
          v-model="state.date"
          label="movedate"
          :hint="$t('movementInfo')"
        ></form-common-date>
      </div>
    </div>

    <form-common-dropdown-type
      v-model="state.type"
      table="hive_types"
      label="status"
    ></form-common-dropdown-type>
    <div class="col-12 q-pb-sm">
      <form-common-dropdown-source
        v-model="state.source"
        table="hive_sources"
        label="source"
      ></form-common-dropdown-source>
    </div>

    <div class="col-12 col-md-6 q-pt-sm q-pb-sm">
      <form-common-numeric-position
        v-model="state.position"
        label="position"
        :hint="$t('positionNote')"
        icon="fas fa-arrow-down-1-9"
        numeric-valid="integer"
      >
      </form-common-numeric-position>
    </div>
    <div class="col-12 col-md-6 q-pt-sm q-pb-sm">
      <form-common-numeric-grouphive
        v-model="state.grouphive"
        label="grouphive"
        :hint="$t('grouphiveNote')"
        icon="fas fa-city"
        numeric-valid="integer"
      ></form-common-numeric-grouphive>
    </div>

    <form-common-note v-model="state.note" class="q-pt-sm"></form-common-note>
    <div class="row q-pt-sm q-pb-md">
      <div class="col-12 col-md-6">
        <form-common-done
          v-model="state.modus"
          label="modus"
          status-active="active"
          status-inactive="inactive"
        ></form-common-done>
      </div>
      <div class="col-12 col-md-6">
        <form-common-date
          v-if="!state.modus"
          v-model="state.modusDate"
          label="modusDate"
        ></form-common-date>
      </div>
    </div>
  </q-form>

  <q-btn-group v-if="!ids" spread>
    <q-btn
      unelevated
      size="md"
      color="secondary"
      :loading="isSubmitting"
      :label="$t('save')"
      @click="onSubmit"
    />
    <q-btn
      unelevated
      size="md"
      color="warning"
      :label="$t('reset')"
      @click="onReset"
    />
    <q-btn
      v-if="lastInsert"
      unelevated
      size="md"
      color="info"
      :loading="isSubmitting"
      :label="$t('undo')"
      @click="onUndo"
    />
  </q-btn-group>
  <q-btn-group v-else spread>
    <q-btn
      unelevated
      size="md"
      color="secondary"
      :loading="isSubmitting"
      :label="$t('update')"
      @click="onUpdate"
    ></q-btn>
    <q-btn
      unelevated
      size="md"
      color="warning"
      :label="$t('reset')"
      @click="onReset"
    />
  </q-btn-group>
</template>

<script setup lang="ts">
import { api } from '~/boot/axios';
import { computed, ref } from 'vue';
import { useNotification } from '~/composables/useResponseText';
import dayjs from 'dayjs';
import FormCommonDate from './FormCommonDate.vue';
import FormCommonDone from './FormCommonDone.vue';
import FormCommonDropdownApiary from './FormCommonDropdownApiary.vue';
import FormCommonDropdownSource from './FormCommonDropdownOption.vue';
import FormCommonDropdownType from './FormCommonDropdownOption.vue';
import FormCommonName from './FormCommonName.vue';
import FormCommonNote from './FormCommonNote.vue';
import FormCommonNumericStart from './FormCommonNumeric.vue';
import FormCommonNumericRepeat from './FormCommonNumeric.vue';
import FormCommonNumericGrouphive from './FormCommonNumeric.vue';
import FormCommonNumericPosition from './FormCommonNumeric.vue';
import useVuelidate from '@vuelidate/core';
import { useHivesQuery } from '~/query';
import { filter, merge, orderBy } from 'lodash';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const notification = useNotification();
const { data: hives } = useHivesQuery();
const isSubmitting = ref(false);
const lastInsert = ref(null);
const lastNames = computed(() => (hives ? getNames(hives.value) : ''));
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

const showInterval = ref(false);

const props = defineProps({
  ids: {
    type: Array,
    default: null,
  },
});

const editOptions = ref([]) as any;
const editOptionsCopy = ref([]) as any;
let editDefault = {};
const multipleValues = ref({
  date: false,
  type_id: false,
  source_id: false,
  position: false,
  grouphive: false,
  note: false,
  modus: false,
  modusDate: false,
});
let multipleValuesCopy = {};

const stateDefault = {
  name: '',
  date: dayjs().format('YYYY-MM-DD'),
  position: 0,
  grouphive: 0,
  note: '',
  modus: true,
  modusDate: dayjs().format('YYYY-MM-DD'),
};

const state = ref({
  start: 0,
  repeat: 0,
  apiary: undefined as any,
  type: undefined as any,
  source: undefined as any,
  ...stateDefault,
});
const rules = {};
const v = useVuelidate(rules, state, { $autoDirty: true });

function changeInterval() {
  showInterval.value = !showInterval.value;
}

function getNames(v: any) {
  const data = filter(v, (obj) => !obj.hive_deleted);
  return orderBy(data, 'hive_id', 'desc')
    .slice(0, 3)
    .map((o) => o.hive_name)
    .join(', ');
}

function onReset() {
  if (!props.ids) {
    merge(state.value, stateDefault);
  } else {
    merge(state.value, editDefault);
    merge(multipleValues.value, multipleValuesCopy);
  }
  if (showInterval.value) changeInterval();
  notification.open('positive', t('successReset'));
}

async function onUpdate() {
  isSubmitting.value = true;
  const isFormCorrect = await v.value.$validate();
  if (!isFormCorrect) {
    isSubmitting.value = false;
    return;
  }
  const ids = editOptions.value.map((obj: any) => obj.value);
  let data = { ids: ids, ...state.value, ignore: { ...multipleValues.value } };
  data.type = data.type ? data.type.id : 0;
  data.source = data.source ? data.source.id : 0;

  await api.patch('/v1/hive', JSON.stringify(data)).then(
    (response: any) => {
      console.log(response);
      lastInsert.value = response.data;
      notification.open('positive', '');
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
  isSubmitting.value = false;
  return;
}

async function onUndo() {
  isSubmitting.value = true;
  const data = JSON.stringify({ ids: lastInsert.value });
  await api.patch('/v1/hive/batchDelete?hard=true', data).then(
    (_response: any) => {
      lastInsert.value = null;
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
  const data = { ...state.value };
  data.type = data.type ? data.type.id : 0;
  data.source = data.source ? data.source.id : 0;
  data.apiary = data.apiary ? data.apiary.id : 0;

  await api.post('/v1/hive', JSON.stringify(data)).then(
    (response: any) => {
      lastInsert.value = response.data;
      notification.open('positive', '');
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
  isSubmitting.value = false;
}
</script>
