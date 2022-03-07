<template>
  <q-card-section>
    <div class="text-h6 text-center">{{ t('resetUser.title') }}</div>
    <form-error-max v-if="submitCount >= 15"></form-error-max>
    <q-form v-else @submit="onSubmit" class="q-gutter-md">
      <q-input
        v-model="v.resetKey.$model"
        :error="v.resetKey.$error"
        :error-messages="validationErrors(v.resetKey)"
        name="resetKey"
        :label="t('resetUser.label')"
        required
        disabled
        readonly
        append-inner-icon="fas fa-lock"
      >
      </q-input>
      <form-user-password
        v-model:modelPassword="state.password"
        passwordLabel="newPassword"
        :confirm="true"
      ></form-user-password>

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
import { validationErrors } from '../helpers';
import { useNotification } from '../composables/useResponseText';
import FormUserPassword from 'src/components/FormUserPassword.vue';
import FormErrorMax from 'src/components/FormErrorMax.vue';
import { useI18n } from 'vue-i18n';
const notification = useNotification();
const { t } = useI18n();

const prop = defineProps({
  reset: {
    type: String,
    default: '',
  },
});

const btnLabel = ref('save');
const isSubmitting = ref(false);
const submitCount = ref(0);
const message = ref('');

const state = reactive({
  resetKey: prop.reset ? prop.reset : '',
  password: '',
  confirmPassword: '',
});
const rules = reactive({
  resetKey: { required, alphaNum, maxLengthValue: maxLength(200) },
});

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
    password: state.password,
  };
  await sendForm(form);
  return;
}

async function sendForm(values: any) {
  await AuthService.resetPassword(values).then(
    (data) => {
      const email = data.data.email;

      message.value = t('resetUser.success', { msg: email });

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
