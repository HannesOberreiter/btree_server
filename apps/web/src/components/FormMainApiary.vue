<template>
  <q-form @submit.prevent.stop="onSubmit" class="full-width">
    <div class="row">
      <div class="col-12">
        <form-common-name v-model="state.name"></form-common-name>
      </div>
      <div class="col-12">
        <q-input
          v-model="v.description.$model"
          :error="v.description.$error"
          :error-message="validationErrors(v.description)"
          :no-error-icon="true"
          :label="t('description')"
          name="description"
          type="text"
          filled
        >
        </q-input>
      </div>
      <div class="col-6">
        <q-input
          v-model="v.latitude.$model"
          :error="v.latitude.$error"
          :error-message="validationErrors(v.latitude)"
          :no-error-icon="true"
          :label="t('latitude')"
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
          v-model="v.longitude.$model"
          :error="v.longitude.$error"
          :error-message="validationErrors(v.longitude)"
          :no-error-icon="true"
          :label="t('longitude')"
          :min="-90"
          :max="90"
          name="longitude"
          type="number"
          filled
        >
        </q-input>
      </div>
      <div class="col-12">
        <form-common-note v-model="state.note"></form-common-note>
      </div>
    </div>
  </q-form>
  <q-btn
    unelevated
    @click="onSubmit"
    size="lg"
    color="secondary"
    type="submit"
    :loading="isSubmitting"
    :label="t('save')"
    class="full-width text-white"
  />
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { required, maxLength, between } from '../helpers/i18n-validators';
import { validationErrors } from '../helpers';
import { useNotification } from '../composables/useResponseText';
import { api } from 'boot/axios';
import { PropType, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Apiary } from '../types';

import FormCommonName from './FormCommonName.vue';
import FormCommonNote from './FormCommonNote.vue';

const { t } = useI18n();
const notification = useNotification();

const props = defineProps({
  formData: {
    type: Object as PropType<Apiary>,
    default: () => {
      return {
        name: '',
        description: '',
        latitude: 0,
        longitude: 0,
        note: '',
        url: '',
      };
    },
  },
});
const emit = defineEmits(['onSuccess']);

watch(props, (cur) => {
  state.value = cur.formData;
});
const state = ref({
  ...props.formData,
});

const rules = {
  description: { maxLengthValue: maxLength(512) },
  latitude: { required, betweenValue: between(-90, 90) },
  longitude: { required, betweenValue: between(-90, 90) },
  note: { maxLengthValue: maxLength(2000) },
};
const v = useVuelidate(rules, state);

const isSubmitting = ref(false);

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
}
</script>
