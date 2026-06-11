<script setup lang="ts">
import type { User } from '../types';
import useVuelidate from '@vuelidate/core';
import { truncate } from 'lodash-es';
import { storeToRefs } from 'pinia';
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import BtnBase from '../components/BtnBase.vue';
import FormDropdownServer from '../components/FormDropdownServer.vue';
import FormErrorMax from '../components/FormErrorMax.vue';
import FormInputEmail from '../components/FormInputEmail.vue';
import FormUserPassword from '../components/FormUserPassword.vue';
import { useApiFetch } from '../composables/useApi';
import { useBackend } from '../composables/useBackend';
import { useNotification } from '../composables/useNotification';
import { useAuthUserStore } from '../stores/auth';

const router = useRouter();
const notification = useNotification();

const isSubmitting = ref(true);
const submitCount = ref(0);
const forceDashboardRedirect = ref(false);

const store = useAuthUserStore();
const api = useApiFetch();
const backend = useBackend();

const { activate } = storeToRefs(store);
const state = reactive({
  email: activate.value ? activate.value : '',
  password: '',
  confirmPassword: ''
});

function validLastUrl(): string | undefined {
  const lastUrl = router.currentRoute.value.query.next;
  if (!lastUrl) {
    return undefined;
  }
  if (typeof lastUrl !== 'string') {
    return undefined;
  }
  if (lastUrl === '/') {
    return undefined;
  }
  if (lastUrl.includes('visitor')) {
    return undefined;
  }

  try {
    const parsed = new URL(lastUrl, window.location.origin);
    const allowedOrigins = [
      window.location.origin,
      new URL(backend.urlIgnoreProxy.value).origin
    ];

    if (!allowedOrigins.includes(parsed.origin)) {
      return undefined;
    }

    const allowedBackendOAuthPaths = ['/api/v1/chatgpt/oauth/authorize'];
    if (
      parsed.origin !== window.location.origin &&
      !allowedBackendOAuthPaths.includes(parsed.pathname)
    ) {
      return undefined;
    }

    if (parsed.origin === window.location.origin) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    return parsed.toString();
  } catch {
    return undefined;
  }
}

const truncatedLastUrl = truncate(validLastUrl(), { length: 20 });

const oauthLogin = ref(router.currentRoute.value.query.oauth);

watch(
  activate,
  () => {
    if (activate.value) {
      notification.open('positive', 'accountActivated');
    }
  },
  { immediate: true }
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
    password: state.password
  };
  sendForm(form);
}

function sendForm(user: User) {
  store.login(user).then(
    () => {
      notification.open('positive', '');
      redirect();
    },
    (error: any) => {
      isSubmitting.value = false;
      notification.open('negative', error);
    }
  );
}

async function onLoginGoogle() {
  api.get('/v1/auth/google').then(res => {
    window.location.href = res.url;
  });
}

async function onLoginApple() {
  api.get('/v1/auth/apple').then(res => {
    window.location.href = res.url;
  });
}

onMounted(() => {
  store
    .checkLoginStatus()
    .then(status => {
      if (status) {
        redirect();
      } else {
        isSubmitting.value = false;
      }
    })
    .catch(err => {
      console.error(err);
      isSubmitting.value = false;
    });
});

onUnmounted(() => (isSubmitting.value = false));

async function redirect() {
  const lastUrl = validLastUrl();
  if (lastUrl && !forceDashboardRedirect.value) {
    if (lastUrl.startsWith('http://') || lastUrl.startsWith('https://')) {
      window.location.href = lastUrl;
      return;
    }
    await router.push(lastUrl);
    return;
  }
  await router.push({ name: 'calendar' });
}
</script>

<template>
  <q-card-section>
    <div class="text-h6 text-center">
      {{ $t('login') }}
    </div>
    <FormErrorMax v-if="submitCount >= 15" />
    <q-form v-else class="q-gutter-md" @submit.stop="onSubmit">
      <template v-if="!oauthLogin">
        <FormInputEmail v-model="state.email" />
        <FormUserPassword v-model:model-password="state.password" />
      </template>
      <FormDropdownServer />
      <q-card-actions class="">
        <BtnBase
          v-if="validLastUrl()"
          type="submit"
          size="md"
          color="orange-6"
          class="full-width text-white q-mb-xs"
          :label="`${$t('lastVisit')}: ${truncatedLastUrl}`"
          :disable="isSubmitting"
          :loading="isSubmitting"
        />
        <BtnBase
          v-if="!oauthLogin"
          type="submit"
          size="lg"
          color="secondary"
          class="full-width text-white"
          :label="$t('login')"
          :disable="isSubmitting"
          :loading="isSubmitting"
          @click="forceDashboardRedirect = true"
        />
        <div class="q-mt-md full-width">
          <q-btn
            class="full-width"
            color="primary"
            label="Sign in with Apple"
            icon="fab fa-apple"
            no-caps
            outline
            @click="onLoginApple()"
          />
          <q-btn
            class="full-width q-mt-xs"
            color="primary"
            label="Sign in with Google"
            icon="fab fa-google"
            no-caps
            outline
            @click="onLoginGoogle()"
          />
        </div>
      </q-card-actions>
    </q-form>
  </q-card-section>
</template>
