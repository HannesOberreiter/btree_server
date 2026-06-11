<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { reactive, ref } from 'vue';
import { useApiFetch } from '../composables/useApi';
import { useNotification } from '../composables/useNotification';
import { useAuthUserStore } from '../stores/auth';
import BtnBase from './BtnBase.vue';
import FormInputEmail from './FormInputEmail.vue';
import FormUserPassword from './FormUserPassword.vue';

const notification = useNotification();
const storeUser = useAuthUserStore();
const isSubmitting = ref(false);
const api = useApiFetch();

const state = reactive({
  email: storeUser.getUser.email || '',
  oldPassword: '',
  newPassword: ''
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
    newPassword: state.newPassword
  };
  await api.patch('/v1/user', data).then(
    response => {
      storeUser.$state.user.email = response.email;
      notification.open('positive', '');
    },
    error => {
      notification.open('negative', error);
    }
  );
  isSubmitting.value = false;
}
</script>

<template>
  <q-form @submit.prevent.stop="onSubmit">
    <div class="row">
      <div class="col-12">
        <FormUserPassword
          v-model:model-password="state.oldPassword"
          password-label="oldPassword"
          :confirm="false"
        />
        <FormInputEmail v-model="state.email" :disable-mail="true" />
        <FormUserPassword
          v-model:model-password="state.newPassword"
          password-label="newPassword"
          :confirm="true"
        />
      </div>
    </div>
  </q-form>
  <BtnBase
    size="md"
    color="secondary"
    type="submit"
    :loading="isSubmitting"
    :label="$t('save')"
    class="full-width text-white"
    @click.prevent.stop="onSubmit"
  />
  <BtnBase
    size="md"
    color="grey-8"
    type="a"
    href="/visitor/recover"
    :label="$t('forgot')"
    class="full-width text-white q-mt-lg"
  />
</template>
