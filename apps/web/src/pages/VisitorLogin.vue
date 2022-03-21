<template>
  <q-card-section>
    <div class="text-h6 text-center">{{ t('login') }}</div>
    <form-error-max v-if="submitCount >= 15"></form-error-max>
    <q-form v-else class="q-gutter-md" @submit="onSubmit">
      <form-user-email
        v-model:modelMail="state.email"
        @update:model-mail="(value) => (state.email = value)"
      ></form-user-email>
      <form-user-password
        v-model:modelPassword="state.password"
      ></form-user-password>
      <q-card-actions class="">
        <q-btn
          type="submit"
          unelevated
          size="lg"
          color="secondary"
          class="full-width text-white"
          :label="t('login')"
          :disable="isSubmitting"
          :loading="isSubmitting"
        />
      </q-card-actions>
    </q-form>
  </q-card-section>
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { onMounted, reactive, ref } from 'vue';
import { useAuthUserStore } from '~/stores/auth';
import { User } from '~/types';
import { useRouter } from 'vue-router';
import { useNotification } from '~/composables/useResponseText';
import { useI18n } from 'vue-i18n';
import FormUserEmail from '~/components/FormUserEmail.vue';
import FormUserPassword from '~/components/FormUserPassword.vue';
import FormErrorMax from '~/components/FormErrorMax.vue';

const router = useRouter();
const prop = defineProps({
  activate: {
    type: String,
    default: '',
  },
});

const notification = useNotification();
const isSubmitting = ref(false);
const submitCount = ref(0);
const { t } = useI18n();

const store = useAuthUserStore();
const state = reactive({
  email: accountActivated(),
  password: '',
  confirmPassword: '',
});

const v = useVuelidate();

function accountActivated() {
  const param = prop.activate ? prop.activate : '';
  if (param) {
    const message = 'You account was successfully activated!';
    notification.open('positive', message);
  }
  return param;
}

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
    password: state.password,
  };
  await sendForm(form);
  return;
}

async function sendForm(user: User) {
  await store.login(user).then(
    async () => {
      notification.open('positive', '');
      await router.push({ name: 'calendar' });
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
  isSubmitting.value = false;
}

onMounted(async () => {
  if (store.isLoggedIn) {
    await router.push({ name: 'calendar' });
  }
});
</script>
