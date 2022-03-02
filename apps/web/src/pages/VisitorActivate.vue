<template>
  <q-card-section>
    <div class="text-h6 text-center">{{ t('activateTitle') }}</div>
    <form-error-max v-if="submitCount >= 15"></form-error-max>

    <q-form v-else @submit="onSubmit" class="q-gutter-md">
      <p class="text-center">
        Vielen Dank für deine Registrierung, bitte aktiviere noch deinen
        Account.
      </p>
      <q-input
        v-model="v.resetKey.$model"
        :error="v.resetKey.$error"
        :error-messages="validationErrors(v.resetKey)"
        name="resetKey"
        :label="t('activateLabel')"
        required
        disabled
        readonly
        append-inner-icon="fas fa-lock"
      >
      </q-input>

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
import useVuelidate from '@vuelidate/core';
import { required, maxLength, alphaNum } from '@vuelidate/validators';
import { reactive, ref } from 'vue';
import AuthService from '../services/auth.service';
import { useRouter } from 'vue-router';
import { validationErrors } from '../helpers';
import { useNotification } from '../composables/useResponseText';
import FormErrorMax from 'src/components/FormErrorMax.vue';
import { useI18n } from 'vue-i18n';
const notification = useNotification();
const { t } = useI18n();
const router = useRouter();

const prop = defineProps({
  activate: {
    type: String,
    default: '',
  },
});

const btnLabel = ref('activate');
const isSubmitting = ref(false);
const submitCount = ref(0);
const message = ref('');

const state = reactive({
  resetKey: prop.activate ? prop.activate : '',
});
const rules = {
  resetKey: { required, alphaNum, maxLengthValue: maxLength(200) },
};

const v = useVuelidate(rules, state);

async function onSubmit() {
  isSubmitting.value = true;
  const isFormCorrect = await v.value.$validate();
  if (!isFormCorrect) {
    isSubmitting.value = false;
    return;
  }
  submitCount.value++;
  const form: any = {
    resetKey: state.resetKey,
  };
  await sendForm(form);
  return;
}

async function sendForm(value: any) {
  await AuthService.activate(value).then(
    async (reponse) => {
      btnLabel.value = 'success';
      message.value = t('activateSuccess');
      notification.open('positive', t('activateSuccess'));
      isSubmitting.value = false;
      await router.push({
        name: 'login',
        params: { activate: reponse.data.email },
      });
    },
    (error) => {
      if (error.response.status === 403) {
        const message =
          "The activation key is not valid anymore. You can also activate your account with the 'Forgot your password' link below.";
        notification.open('negative', message);
      } else {
        notification.open('negative', error.response);
      }
      isSubmitting.value = false;
    }
  );
}
</script>
