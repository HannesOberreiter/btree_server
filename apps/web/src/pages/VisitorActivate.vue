<template>
  <q-card-section>
    <div class="text-h6 text-center">{{ t('activateUser.title') }}</div>
    <form-error-max v-if="submitCount >= 15"></form-error-max>

    <q-form v-else class="q-gutter-md" @submit="onSubmit">
      <p class="text-center">
        {{ t('activateUser.message') }}
        Vielen Dank für deine Registrierung, bitte aktiviere noch deinen
        Account.
      </p>
      <q-input
        v-model="v.resetKey.$model"
        :error="v.resetKey.$error"
        :error-messages="validationErrors(v.resetKey)"
        name="resetKey"
        :label="t('activateUser.label')"
        required
        disabled
        readonly
        append-inner-icon="fas fa-lock"
      >
      </q-input>

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
import { useRouter } from 'vue-router';
import { validationErrors } from '~/helpers';
import AuthService from '~/services/auth.service';
import useVuelidate from '@vuelidate/core';
import { maxLength, required, alphaNum } from '~/helpers/i18n-validators';
import { useAuthUserStore } from '~/stores/auth';
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const notification = useNotification();
const { t } = useI18n();
const router = useRouter();
const userStore = useAuthUserStore();

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
  resetKey: {
    required: required(t('key')),
    alphaNum,
    maxLengthValue: maxLength(200),
  },
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
    (response) => {
      btnLabel.value = 'success';
      message.value = t('activateUser.success');
      notification.open('positive', 'activateUser.success');
      isSubmitting.value = false;
      userStore.activate = response.email;
      router.push({
        name: 'login',
      });
    },
    (error) => {
      if (error.statusCode === 403) {
        const message = t('activateUser.notValid');
        notification.open('negative', message);
      } else {
        notification.open('negative', error);
      }
      isSubmitting.value = false;
    }
  );
}
</script>
