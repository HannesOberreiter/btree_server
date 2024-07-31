<template>
  <q-card-section>
    <div class="text-h6 text-center">{{ t('unsubscribe.name') }}</div>
    <form-error-max v-if="submitCount >= 15"></form-error-max>
    <q-form v-else class="q-gutter-md" @submit="onSubmit">
      <form-input-email v-model="state.email"></form-input-email>
      <form-dropdown-server></form-dropdown-server>
      <q-card-actions class="">
        <btn-base
          type="submit"
          size="lg"
          color="secondary"
          class="full-width text-white"
          :label="t(btnLabel)"
          :disable="isSubmitting || message !== ''"
          :loading="isSubmitting"
        />
      </q-card-actions>
    </q-form>
    <p v-if="message" class="text-primary text-center">
      {{ message }}
    </p>
  </q-card-section>
</template>

<script setup lang="ts">
import { useNotification } from '~/composables/useNotification';
import AuthService from '~/services/auth.service';
import useVuelidate from '@vuelidate/core';
import FormErrorMax from '~/components/FormErrorMax.vue';
import FormInputEmail from '~/components/FormInputEmail.vue';
import FormDropdownServer from '~/components/FormDropdownServer.vue';

import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const notification = useNotification();
const { t } = useI18n();
const message = ref('');
const btnLabel = ref('unsubscribe.btn');
const isSubmitting = ref(false);
const submitCount = ref(0);

const state = reactive({
  email: '',
});

const v = useVuelidate();

async function onSubmit() {
  isSubmitting.value = true;
  const isFormCorrect = await v.value.$validate();
  if (!isFormCorrect) {
    isSubmitting.value = false;
    return;
  }
  submitCount.value++;
  const form: any = {
    email: state.email,
  };
  await sendForm(form);
  return;
}

async function sendForm(from: any) {
  await AuthService.unsubscribe(from).then(
    (response) => {
      const email = response.email;
      message.value = t('unsubscribe.success', { msg: email });

      isSubmitting.value = false;
      btnLabel.value = 'success';
      notification.open('positive', message.value, false);
    },
    (error) => {
      notification.open('negative', error);
      isSubmitting.value = false;
    },
  );
}
</script>
