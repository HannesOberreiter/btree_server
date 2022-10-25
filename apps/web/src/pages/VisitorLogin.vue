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
          type="submit"
          size="lg"
          color="secondary"
          class="full-width text-white"
          :label="$t('login')"
          :disable="isSubmitting"
          :loading="isSubmitting"
        />
      </q-card-actions>
    </q-form>
  </q-card-section>
</template>

<script setup lang="ts">
import { useAuthUserStore } from '~/stores/auth';
import { useNotification } from '~/composables/useNotification';
import { User } from '~/types';
import useVuelidate from '@vuelidate/core';
import { RouteLocationRaw } from 'vue-router';

const router = useRouter();
const lastUrl = router.currentRoute.value.query.next;
const notification = useNotification();

const isSubmitting = ref(true);
const submitCount = ref(0);

const store = useAuthUserStore();
const { activate } = storeToRefs(store);
const state = reactive({
  email: activate.value ? activate.value : '',
  password: '',
  confirmPassword: '',
});

watch(
  activate,
  () => {
    if (activate.value) notification.open('positive', 'accountActivated');
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
      console.error(error);
      notification.open('negative', error);
    }
  );
}

onMounted(() => {
  store
    .checkLoginStatus()
    .then((status) => {
      if (status) redirect();
      else isSubmitting.value = false;
    })
    .catch(() => (isSubmitting.value = false));
});

onUnmounted(() => (isSubmitting.value = false));

async function redirect() {
  if (lastUrl) {
    if (!lastUrl.includes('visitor'))
      await router.push(lastUrl as RouteLocationRaw);
  }
  await router.push({ name: 'calendar' });
}
</script>
