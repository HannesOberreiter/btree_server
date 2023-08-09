<script setup lang="ts">
import { useAuthUserStore } from '~/stores/auth';
import { useNotification } from '~/composables/useNotification';
import { User } from '~/types';
import useVuelidate from '@vuelidate/core';
import { truncate } from 'lodash-es';
import { useRouter } from 'vue-router';
import { reactive, ref, onMounted, onUnmounted, watch } from 'vue';
import { storeToRefs } from 'pinia';

import FormUserPassword from '~/components/FormUserPassword.vue';
import FormInputEmail from '~/components/FormInputEmail.vue';
import FormErrorMax from '~/components/FormErrorMax.vue';
import { useApiFetch } from '~/composables/useApi';

const router = useRouter();
const notification = useNotification();

const isSubmitting = ref(true);
const submitCount = ref(0);
const forceDashboardRedirect = ref(false);
const isAppleStoreWrapper = document.cookie.includes('iOS');

const store = useAuthUserStore();
const api = useApiFetch();

const { activate } = storeToRefs(store);
const state = reactive({
  email: activate.value ? activate.value : '',
  password: '',
  confirmPassword: '',
});

const validLastUrl = (): string | undefined => {
  const lastUrl = router.currentRoute.value.query.next;
  if (!lastUrl) return undefined;
  if (typeof lastUrl !== 'string') return undefined;
  if (lastUrl === '/') return undefined;
  if (lastUrl.includes('visitor')) return undefined;

  return lastUrl;
};

const truncatedLastUrl = truncate(validLastUrl(), { length: 20 });

watch(
  activate,
  () => {
    if (activate.value) notification.open('positive', 'accountActivated');
  },
  { immediate: true },
);

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
    password: state.password,
  };
  sendForm(form);
}

function sendForm(user: User) {
  store.login(user).then(
    () => {
      notification.open('positive', '');
      redirect();
    },
    (error) => {
      isSubmitting.value = false;
      notification.open('negative', error);
    },
  );
}

async function onLoginGoogle() {
  api.get('/v1/auth/google').then((res) => {
    window.location.href = res.url;
  });
}

onMounted(() => {
  store
    .checkLoginStatus()
    .then((status) => {
      if (status) redirect();
      else isSubmitting.value = false;
    })
    .catch((err) => {
      console.error(err);
      isSubmitting.value = false;
    });
});

onUnmounted(() => (isSubmitting.value = false));

async function redirect() {
  if (validLastUrl() && !forceDashboardRedirect.value) {
    await router.push(validLastUrl());
    return;
  }
  await router.push({ name: 'calendar' });
}
</script>

<template>
  <q-card-section>
    <div class="text-h6 text-center">{{ $t('login') }}</div>
    <form-error-max v-if="submitCount >= 15"></form-error-max>
    <q-form v-else class="q-gutter-md" @submit.stop="onSubmit">
      <form-input-email v-model="state.email"></form-input-email>
      <form-user-password
        v-model:modelPassword="state.password"
      ></form-user-password>
      <q-card-actions class="">
        <btn-base
          v-if="validLastUrl()"
          type="submit"
          size="md"
          color="orange-6"
          class="full-width text-white q-mb-xs"
          :label="$t('lastVisit') + ': ' + truncatedLastUrl"
          :disable="isSubmitting"
          :loading="isSubmitting"
        />
        <btn-base
          type="submit"
          size="lg"
          color="secondary"
          class="full-width text-white"
          :label="$t('login')"
          :disable="isSubmitting"
          :loading="isSubmitting"
          @click="forceDashboardRedirect = true"
        />

        <q-btn
          v-if="!isAppleStoreWrapper"
          color="primary"
          label="Google"
          icon="fab fa-google"
          class="full-width q-mt-lg"
          no-caps
          outline
          @click="onLoginGoogle()"
        />
      </q-card-actions>
    </q-form>
  </q-card-section>
</template>
