<template>
  <div v-if="isLoading || isError">
    <global-loading></global-loading>
  </div>
  <div v-else>
    <q-form class="full-width" @submit.prevent.stop="onSubmit">
      <div class="row">
        <div class="col-12">
          <form-input-name
            v-model="state.name"
            label="name"
            :required="true"
          ></form-input-name>
        </div>
        <div class="col-12">
          <q-input
            v-model="state.description"
            :error="v.description.$error"
            :error-message="validationErrors(v.description)"
            :no-error-icon="true"
            :label="$t('description')"
            name="description"
            type="text"
            filled
          >
          </q-input>
        </div>
        <div class="col-6">
          <q-input
            v-model="state.latitude"
            :error="v.latitude.$error"
            :error-message="validationErrors(v.latitude)"
            :no-error-icon="true"
            :label="$t('latitude')"
            name="latitude"
            :min="-90"
            :max="90"
            type="number"
            filled
          >
          </q-input>
        </div>
        <div class="col-6">
          <q-input
            v-model="state.longitude"
            :error="v.longitude.$error"
            :error-message="validationErrors(v.longitude)"
            :no-error-icon="true"
            :label="$t('longitude')"
            :min="-90"
            :max="90"
            name="longitude"
            type="number"
            filled
          >
          </q-input>
        </div>
        <div class="col-12">
          <input-note v-model="state.note"></input-note>
        </div>
      </div>
    </q-form>
    <q-btn
      v-if="id === 0"
      unelevated
      size="md"
      color="secondary"
      type="submit"
      :loading="isSubmitting"
      :label="$t('save')"
      class="full-width text-white"
      @click="onSubmit"
    />
    <q-btn-group v-else spread>
      <q-btn
        unelevated
        size="md"
        color="secondary"
        :loading="isSubmitting"
        :label="$t('save')"
        class="full-width text-white"
        @click="onEdit"
      />
      <q-btn
        unelevated
        size="md"
        :color="state.modus ? 'orange' : 'primary'"
        :loading="isSubmitting"
        :label="state.modus ? $t('deactivate') : $t('activate')"
        class="full-width text-white"
        @click="onModus"
      />
      <q-btn
        v-if="!apiary.hive_count"
        unelevated
        size="md"
        color="negative"
        :loading="isSubmitting"
        :label="$t('delete')"
        class="full-width text-white"
        @click="onDelete"
      />
    </q-btn-group>
  </div>
</template>

<script setup lang="ts">
import { api } from '~/boot/axios';
import { required, maxLength, between } from '~/helpers/i18n-validators';
import { useApiaryQuery } from '~/composables/useQuery';
import { useNotification } from '~/composables/useResponseText';
import { validationErrors } from '~/helpers';
import FormInputName from './FormInputText.vue';
import InputNote from './FormInputNote.vue';
import GlobalLoading from './GlobalLoading.vue';
import useVuelidate from '@vuelidate/core';

const notification = useNotification();
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
const emit = defineEmits(['onSuccess']);
const id = computed(() => (props.ids ? (props.ids[0] as number) : 0));
const {
  isLoading,
  data: apiary,
  isError,
  refetch,
} = useApiaryQuery(id.value, {
  enabled: computed(() => id.value !== 0),
});

const state = ref({
  name: apiary.value ? apiary.value.name : '',
  description: apiary.value ? apiary.value.description : '',
  latitude: apiary.value
    ? apiary.value.latitude
    : props.latlng
    ? props.latlng.lat
    : 0,
  longitude: apiary.value
    ? apiary.value.longitude
    : props.latlng
    ? props.latlng.lng
    : 0,
  note: apiary.value ? apiary.value.note : '',
  url: apiary.value ? apiary.value.url : '',
  modus: apiary.value ? apiary.value.modus : true,
});

if (!apiary.value) {
  watch(apiary, () => {
    state.value = {
      name: apiary.value.name,
      description: apiary.value.description,
      latitude: apiary.value.latitude,
      longitude: apiary.value.longitude,
      note: apiary.value.note,
      url: apiary.value.url,
      modus: apiary.value.modus,
    };
  });
}

const rules = {
  description: { maxLengthValue: maxLength(512) },
  latitude: { required, betweenValue: between(-90, 90) },
  longitude: { required, betweenValue: between(-90, 90) },
  note: { maxLengthValue: maxLength(2000) },
};
const v = useVuelidate(rules, state, { $autoDirty: true });

const isSubmitting = ref(false);

async function onEdit() {
  isSubmitting.value = true;
  const isFormCorrect = await v.value.$validate();
  if (!isFormCorrect) {
    isSubmitting.value = false;
    return;
  }
  let data = { ...state.value } as any;
  data.id = id.value;
  await api.patch('/v1/apiary', JSON.stringify(data)).then(
    async (response: any) => {
      notification.open('positive', '');
      await refetch.value();
      emit('onSuccess', response.data);
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
  isSubmitting.value = false;
}

async function onModus() {
  isSubmitting.value = true;
  const data = {
    id: id.value,
    modus: !state.value.modus,
  };
  await api.patch('/v1/apiary', data).then(
    async (response: any) => {
      notification.open('positive', '');
      await refetch.value();
      emit('onSuccess', response.data);
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
  isSubmitting.value = false;
}

function onDelete() {
  api.delete(`/v1/apiary/${id.value}`).then(
    (response: any) => {
      notification.open('positive', '');
      emit('onSuccess', response.data);
    },
    (error) => {
      notification.open('negative', error);
    }
  );
}

async function onSubmit() {
  isSubmitting.value = true;
  const isFormCorrect = await v.value.$validate();
  if (!isFormCorrect) {
    isSubmitting.value = false;
    return;
  }
  const data = JSON.stringify(state.value);
  await api.post('/v1/apiary', data).then(
    (response: any) => {
      notification.open('positive', '');
      emit('onSuccess', response.data);
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
  isSubmitting.value = false;
}
</script>
