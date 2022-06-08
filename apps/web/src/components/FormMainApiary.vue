<template>
  <q-form class="full-width" data-cy="form-apiary" @submit.prevent.stop="">
    <div class="row">
      <div class="col-12">
        <form-input-text
          v-model="state.name"
          label="name"
          :required="isEdit ? false : true"
          :values="values"
          :reset="reset"
        ></form-input-text>
      </div>
      <div class="col-12">
        <form-input-text
          v-model="state.description"
          label="description"
          :values="values"
          :reset="reset"
          :max-valid="512"
        ></form-input-text>
      </div>
      <div class="col-6">
        <form-input-numeric
          v-model="state.latitude"
          label="latitude"
          :values="values"
          :reset="reset"
          icon=""
          :min-valid="-90"
          :max-valid="90"
          numeric-valid="decimal"
        ></form-input-numeric>
      </div>
      <div class="col-6">
        <form-input-numeric
          v-model="state.longitude"
          label="longitude"
          :values="values"
          :reset="reset"
          icon=""
          :min-valid="-90"
          :max-valid="90"
          numeric-valid="decimal"
        ></form-input-numeric>
      </div>
      <div class="col-12">
        <form-input-url
          v-model="state.url"
          :values="values"
          :reset="reset"
        ></form-input-url>
      </div>
      <div class="col-12">
        <form-input-note
          v-model="state.note"
          :values="values"
          :reset="reset"
        ></form-input-note>
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
import { required } from '~/helpers/i18n-validators';
import { useNotification } from '~/composables/useNotification';
import useVuelidate from '@vuelidate/core';
import { flatten, map, merge } from 'lodash-es';
import { useApiFetch } from '~/composables/useApi';

const api = useApiFetch();
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
