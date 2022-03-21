<template>
  <q-form @submit.prevent.stop="onSubmit">
    <div class="row">
      <div class="col-12">
        <form-user-password1
          v-model:modelPassword="state.oldPassword"
          :password-label="`oldPassword`"
          :confirm="false"
        ></form-user-password1>
        <form-user-email
          v-model:modelMail="state.email"
          :disable-mail="true"
          @update:modelMail="(value) => (state.email = value)"
        ></form-user-email>
        <form-user-password
          v-model:modelPassword="state.newPassword"
          :password-label="`newPassword`"
          :confirm="true"
        ></form-user-password>
      </div>
    </div>
  </q-form>
  <q-btn
    unelevated
    size="md"
    color="secondary"
    type="submit"
    :loading="isSubmitting"
    :label="t('save')"
    class="full-width text-white"
    @click.prevent.stop="onSubmit"
  />
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { useNotification } from '~/composables/useResponseText';
import { api } from 'boot/axios';
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthUserStore } from 'src/stores/auth';

import FormUserEmail from './FormUserEmail.vue';
import FormUserPassword from './FormUserPassword.vue';
import FormUserPassword1 from './FormUserPassword.vue';

const { t } = useI18n();
const notification = useNotification();
const storeUser = useAuthUserStore();
const isSubmitting = ref(false);

const state = reactive({
  email: storeUser.getUser.email,
  oldPassword: '',
  newPassword: '',
});

const rules = {};
const v = useVuelidate(rules, state);

async function onSubmit() {
  isSubmitting.value = true;
  const isFormCorrect = await v.value.$validate();
  if (!isFormCorrect) {
    isSubmitting.value = false;
    return;
  }
  const data = {
    email: state.email,
    password: state.oldPassword,
    newPassword: state.newPassword,
  };
  await api.patch('/v1/user', data).then(
    (data) => {
      storeUser.$state.user.email = data.data.email;
      notification.open('positive', '');
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
  isSubmitting.value = false;
}
</script>
