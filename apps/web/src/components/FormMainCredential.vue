<template>
  <q-form @submit.prevent.stop="onSubmit">
    <div class="row">
      <div class="col-12">
        <form-user-password
          v-model:modelPassword="state.oldPassword"
          password-label="oldPassword"
          :confirm="false"
        ></form-user-password>
        <form-input-email
          v-model:modelMail="state.email"
          :disable-mail="true"
          @update:model-mail="(value) => (state.email = value)"
        ></form-input-email>
        <form-user-password
          v-model:modelPassword="state.newPassword"
          password-label="newPassword"
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
    :label="$t('save')"
    class="full-width text-white"
    @click.prevent.stop="onSubmit"
  />
</template>

<script setup lang="ts">
import { useAuthUserStore } from '~/stores/auth';
import { useNotification } from '~/composables/useResponseText';
import FormInputEmail from './FormInputEmail.vue';
import FormUserPassword from './FormUserPassword.vue';
import useVuelidate from '@vuelidate/core';
import { useApiFetch } from '~/composables/useApi';

const notification = useNotification();
const storeUser = useAuthUserStore();
const isSubmitting = ref(false);
const api = useApiFetch();

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
    (response) => {
      storeUser.$state.user.email = response.email;
      notification.open('positive', '');
    },
    (error) => {
      notification.open('negative', error);
    }
  );
  isSubmitting.value = false;
}
</script>
