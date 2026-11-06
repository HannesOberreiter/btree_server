<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { flatten, map, merge } from 'lodash-es';
import { computed, ref, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApiFetch } from '../composables/useApi';
import { useNotification } from '../composables/useNotification';
import { requiredField } from '../helpers/i18n-validators';
import BtnBase from './BtnBase.vue';
import FromButtons from './FormButtons.vue';
import FormInputCheckbox from './FormInputCheckbox.vue';
import FormInputNote from './FormInputNote.vue';
import FormInputNumeric from './FormInputNumeric.vue';
import FormInputText from './FormInputText.vue';
import FormInputUrl from './FormInputUrl.vue';

const props = defineProps({
  ids: {
    type: Array,
    default: null
  },
  latlng: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['success']);

const stateDefault = {
  name: '',
  description: '',
  latitude: 0,
  longitude: 0,
  elevation: null as number | null,
  note: '',
  url: '',
  modus: true
};

const api = useApiFetch();
const notification = useNotification();
const { t } = useI18n();
const values = ref({});
const reset = ref(0);
const editOptions = ref([]) as any;
const editOptionsCopy = ref([]) as any;
const loadingElevation = ref(false);

const ids = ref(props.ids);
const isEdit = computed(() => {
  if (ids.value === null) {
    return false;
  }
  if (ids.value.length === 0) {
    return false;
  }
  return true;
});
if (isEdit.value) {
  getEdit(unref(ids.value));
}

const state = ref({
  ...stateDefault
});

const rules = {
  latitude: {
    required: requiredField(t('latitude'))
  },
  longitude: {
    required: requiredField(t('longitude'))
  }
};
const v = useVuelidate(rules, state, { $autoDirty: true });

watch(
  () => props.latlng,
  cur => {
    if (cur) {
      state.value.latitude = props.latlng.lat;
      state.value.longitude = props.latlng.lng;
      if (!isEdit.value && state.value.elevation === null) {
        requestElevation(false);
      }
    }
  },
  {
    immediate: true
  }
);

function validCoordinates() {
  const latitude = Number(state.value.latitude);
  const longitude = Number(state.value.longitude);
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude !== 0 &&
    longitude !== 0
  );
}

function requestElevationOnBlur() {
  if (!isEdit.value && state.value.elevation === null && validCoordinates()) {
    requestElevation(false);
  }
}

async function requestElevation(showError = true) {
  if (!validCoordinates() || loadingElevation.value) {
    return;
  }

  loadingElevation.value = true;
  await api
    .get(
      '/v1/service/elevation',
      {
        latitude: state.value.latitude,
        longitude: state.value.longitude
      },
      false,
      showError
    )
    .then(
      (response: any) => {
        state.value.elevation = response.elevation;
      },
      error => {
        if (showError) {
          notification.open('negative', error);
        }
      }
    );
  loadingElevation.value = false;
}

async function getEdit(id: unknown[]) {
  return await api.post('/v1/apiary/batchGet', { ids: id }).then(
    (response: any) => {
      const editIds = map(response, (row: any) => [
        { value: row.id, label: `ID: ${row.id} / (${row.name})` }
      ]);
      editOptions.value = flatten(editIds);
      editOptionsCopy.value = [...unref(editOptions.value)];
      values.value = response;
    },
    error => {
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
  emit('success', true);
}
</script>

<template>
  <q-form class="full-width" data-cy="form-apiary" @submit.prevent.stop="">
    <div class="row">
      <div class="col-12">
        <FormInputText
          v-model="state.name"
          label="name"
          name="apiary"
          :required="isEdit ? false : true"
          :values="values"
          :reset="reset"
        />
      </div>
      <div class="col-12">
        <FormInputText
          v-model="state.description"
          label="description"
          :values="values"
          :reset="reset"
          :max-valid="512"
        />
      </div>
      <div class="col-6">
        <FormInputNumeric
          v-model="state.latitude"
          label="latitude"
          :values="values"
          :reset="reset"
          icon=""
          :min-valid="-90"
          :max-valid="90"
          numeric-valid="decimal"
          @blur="requestElevationOnBlur"
        />
      </div>
      <div class="col-6">
        <FormInputNumeric
          v-model="state.longitude"
          label="longitude"
          :values="values"
          :reset="reset"
          icon=""
          :min-valid="-180"
          :max-valid="180"
          numeric-valid="decimal"
          @blur="requestElevationOnBlur"
        />
      </div>
      <div class="col-12">
        <FormInputNumeric
          v-model="state.elevation"
          label="elevation"
          :values="values"
          :reset="reset"
          icon="fas fa-mountain"
          :min-valid="-500"
          :max-valid="9000"
          numeric-valid="integer"
        >
          <template #deepAfter>
            <BtnBase
              flat
              round
              dense
              icon="fas fa-location-crosshairs"
              :disable="!validCoordinates()"
              :loading="loadingElevation"
              @click="requestElevation(true)"
            >
              <q-tooltip>{{ $t('requestElevation') }}</q-tooltip>
            </BtnBase>
          </template>
        </FormInputNumeric>
      </div>
      <div class="col-12">
        <FormInputUrl v-model="state.url" :values="values" :reset="reset" />
      </div>
      <div class="col-12">
        <FormInputNote v-model="state.note" :values="values" :reset="reset" />
      </div>
      <div class="col-12">
        <FormInputCheckbox
          v-model="state.modus"
          :values="values"
          :reset="reset"
          label="modus"
          status-active="active"
          status-inactive="inactive"
        />
      </div>
    </div>
  </q-form>
  <FromButtons
    :state="state"
    :is-edit="isEdit"
    :edit-ids="editOptions"
    :v="v"
    form="apiary"
    @reset="onReset"
    @change="onChange"
  />
</template>
