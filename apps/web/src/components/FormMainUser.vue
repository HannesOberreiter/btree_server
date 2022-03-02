<template>
  <q-form @submit.prevent.stop="onSubmit">
    <div class="row">
      <div class="col-6 q-pr-sm">
        <q-input
          v-model="v.firstname.$model"
          :error="v.firstname.$error"
          :error-message="validationErrors(v.firstname)"
          :no-error-icon="true"
          :label="t('firstname')"
          name="firstname"
          type="text"
          filled
        >
        </q-input>
      </div>
      <div class="col-6">
        <q-input
          v-model="v.lastname.$model"
          :error="v.lastname.$error"
          :error-message="validationErrors(v.lastname)"
          :no-error-icon="true"
          :label="t('lastname')"
          name="lastname"
          type="text"
          filled
        >
        </q-input>
      </div>
      <div class="col-12">
        <form-user-language v-model="state.lang"></form-user-language>
      </div>
      <div class="col-12">
        <form-user-newsletter v-model="state.newsletter"></form-user-newsletter>
      </div>
      <div class="col-12">
        <q-checkbox
          v-model="state.sound"
          color="primary"
          :true-value="true"
          :false-value="false"
        >
          <slot>
            {{ t('soundHint') }}
          </slot>
        </q-checkbox>
      </div>
      <div class="col-12">
        <q-checkbox
          v-model="state.acdate"
          color="primary"
          :true-value="true"
          :false-value="false"
        >
          <slot>
            {{ t('visHint') }}
          </slot>
        </q-checkbox>
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
import { required, maxLength } from '../helpers/i18n-validators';
import { validationErrors } from '../helpers';
import { useNotification } from '../composables/useResponseText';
import { api } from 'boot/axios';
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthUserStore } from 'src/stores/auth';
import { storeToRefs } from 'pinia';

import FormUserLanguage from './FormUserLanguage.vue';
import FormUserNewsletter from './FormUserNewsletter.vue';
import { LANGUAGES } from 'src/constants';

const { t } = useI18n();
const notification = useNotification();
const storeUser = useAuthUserStore();
const { user } = storeToRefs(storeUser);
const isSubmitting = ref(false);

const state = reactive({
  firstname: user.value.firstname || '',
  lastname: user.value.lastname || '',
  format: user.value.format || '',
  lang: user.value.lang === 'de' ? LANGUAGES[1] : LANGUAGES[0],
  sound: user.value.sound,
  newsletter: user.value.newsletter,
  acdate: user.value.acdate,
});

const rules = {
  firstname: { maxLengthValue: maxLength(45) },
  lastname: { maxLengthValue: maxLength(45) },
  format: {
    required,
  },
  lang: {
    required,
  },
  sound: {},
  acdate: {},
};
const v = useVuelidate(rules, state);

async function onSubmit() {
  isSubmitting.value = true;
  const isFormCorrect = await v.value.$validate();
  if (!isFormCorrect) {
    isSubmitting.value = false;
    return;
  }

  const data = {
    firstname: state.firstname,
    lastname: state.lastname,
    lang: state.lang.value,
    sound: state.sound,
    acdate: state.acdate,
  };
  await api.patch('/v1/user', data).then(
    (response: any) => {
      useAuthUserStore().refresh(response.data);
      notification.open('positive', '');
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
  isSubmitting.value = false;
}
</script>
