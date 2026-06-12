<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import BtnBase from '../components/BtnBase.vue';
import FormDropdownServer from '../components/FormDropdownServer.vue';
import FormErrorMax from '../components/FormErrorMax.vue';
import FormInputEmail from '../components/FormInputEmail.vue';
import { useNotification } from '../composables/useNotification';
import AuthService from '../services/auth.service';

const notification = useNotification();
const { t } = useI18n();
const message = ref('');
const btnLabel = ref('reset');
const isSubmitting = ref(false);
const submitCount = ref(0);

const state = reactive({
  email: ''
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
    email: state.email
  };
  await sendForm(form);
}

async function sendForm(from: any) {
  await AuthService.resetMail(from).then(
    response => {
      const email = response.email;
      message.value = t('recoverUser.success', { msg: email });

      isSubmitting.value = false;
      btnLabel.value = 'success';
      notification.open('positive', message.value, true);
    },
    error => {
      notification.open('negative', error);
      isSubmitting.value = false;
    }
  );
}
</script>

<template>
  <q-card-section>
    <div class="text-h6 text-center">
      {{ t('recoverUser.title') }}
    </div>
    <FormErrorMax v-if="submitCount >= 15" />
    <q-form v-else class="q-gutter-md" @submit="onSubmit">
      <p class="text-center">
        {{ t('recoverUser.text') }}
      </p>
      <FormInputEmail v-model="state.email" />
      <FormDropdownServer />
      <q-card-actions class="">
        <BtnBase
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
