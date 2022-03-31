<template>
  <q-card-section>
    <div class="text-h6 text-center">{{ t('recoverUser.title') }}</div>
    <form-error-max v-if="submitCount >= 15"></form-error-max>
    <q-form v-else class="q-gutter-md" @submit="onSubmit">
      <p class="text-center">
        {{ t('recoverUser.text') }}
      </p>
      <form-input-email v-model="state.email"></form-input-email>
      <q-card-actions class="">
        <q-btn
          type="submit"
          unelevated
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
import { useNotification } from '~/composables/useResponseText';
import AuthService from '~/services/auth.service';
import FormErrorMax from '~/components/FormErrorMax.vue';
import FormInputEmail from '~/components/FormInputEmail.vue';
import useVuelidate from '@vuelidate/core';

const notification = useNotification();
const { t } = useI18n();
const message = ref('');
const btnLabel = ref('reset');
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
  await AuthService.resetMail(from).then(
    (data) => {
      const email = data.data.email;
      message.value = t('recoverUser.success', { msg: email });

      isSubmitting.value = false;
      btnLabel.value = 'success';
      notification.open('positive', message.value);
    },
    (error) => {
      notification.open('negative', error.response);
      isSubmitting.value = false;
    }
  );
}
</script>
