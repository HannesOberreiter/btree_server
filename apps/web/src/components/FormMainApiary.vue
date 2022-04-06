<template>
  <q-form class="full-width" @submit.prevent.stop="">
    <div class="row">
      <div class="col-12">
        <form-input-name
          v-model="state.name"
          label="name"
          :required="true"
          :values="values"
          :reset="reset"
        ></form-input-name>
      </div>
      <div class="col-12">
        <form-input-description
          v-model="state.description"
          label="description"
          :values="values"
          :reset="reset"
          :max-valid="512"
        ></form-input-description>
      </div>
      <div class="col-6">
        <form-input-latitude
          v-model="state.latitude"
          label="latitude"
          :values="values"
          :reset="reset"
          icon=""
          :min-valid="-90"
          :max-valid="90"
          numeric-valid="decimal"
        ></form-input-latitude>
      </div>
      <div class="col-6">
        <form-input-longitude
          v-model="state.longitude"
          label="longitude"
          :values="values"
          :reset="reset"
          icon=""
          :min-valid="-90"
          :max-valid="90"
          numeric-valid="decimal"
        ></form-input-longitude>
      </div>
      <div class="col-12">
        <input-note
          v-model="state.note"
          :values="values"
          :reset="reset"
        ></input-note>
      </div>
      <div class="col-12">
        <form-input-checkbox
          v-model="state.modus"
          :values="values"
          :reset="reset"
          label="modus"
          status-active="active"
          status-inactive="inactive"
        ></form-input-checkbox>
      </div>
    </div>
  </q-form>
  <form-buttons
    :state="state"
    :is-edit="isEdit"
    :edit-ids="editOptions"
    :v="v"
    form="apiary"
    @reset="onReset"
    @change="onChange"
  ></form-buttons>
</template>

<script lang="ts">
const stateDefault = {
  name: '',
  description: '',
  latitude: 0,
  longitude: 0,
  note: '',
  url: '',
  modus: true,
};
</script>

<script setup lang="ts">
import { api } from '~/boot/axios';
import { required } from '~/helpers/i18n-validators';
import { useNotification } from '~/composables/useResponseText';
import FormInputName from './FormInputText.vue';
import FormInputDescription from './FormInputText.vue';
import FormInputLatitude from './FormInputNumeric.vue';
import FormInputLongitude from './FormInputNumeric.vue';
import InputNote from './FormInputNote.vue';
import useVuelidate from '@vuelidate/core';
import { flatten, map, merge } from 'lodash';
import FormButtons from './FormButtons.vue';
import FormInputCheckbox from './FormInputCheckbox.vue';

const notification = useNotification();
const { t } = useI18n();
const emit = defineEmits(['onSuccess']);

const values = ref({});
const reset = ref(0);
const editOptions = ref([]) as any;
const editOptionsCopy = ref([]) as any;

const props = defineProps({
  ids: {
    type: Array,
    default: null,
  },
  latlng: {
    type: Object,
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

const state = ref({
  ...stateDefault,
});

const rules = {
  latitude: {
    required: required(t('latitude')),
  },
  longitude: {
    required: required(t('longitude')),
  },
};
const v = useVuelidate(rules, state, { $autoDirty: true });

watch(
  () => props.latlng,
  (cur) => {
    if (cur) {
      state.value.latitude = props.latlng.lat;
      state.value.longitude = props.latlng.lng;
    }
  },
  {
    immediate: true,
  }
);

async function getEdit(id: unknown[]) {
  return await api.post('/v1/apiary/batchGet', { ids: id }).then(
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

function onReset() {
  if (!isEdit.value) {
    merge(state.value, stateDefault);
  }
  reset.value++;
  notification.open('info', 'successReset');
}

async function onChange() {
  emit('onSuccess', true);
}
</script>
