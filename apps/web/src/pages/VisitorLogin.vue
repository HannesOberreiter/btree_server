<template>
  <q-card-section>
    <div class="text-h6 text-center">{{ $t('login') }}</div>
    <form-error-max v-if="submitCount >= 15"></form-error-max>
    <q-form v-else class="q-gutter-md" @submit="onSubmit">
      <form-input-email
        v-model:modelMail="state.email"
        @update:model-mail="(value) => (state.email = value)"
      ></form-input-email>
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
const props = defineProps({
  activate: {
    type: String,
    default: '',
  },
});

const isSubmitting = ref(false);
const submitCount = ref(0);

const store = useAuthUserStore();
const state = reactive({
  email: accountActivated(),
  password: '',
  confirmPassword: '',
});

const v = useVuelidate();

function accountActivated() {
  const param = props.activate ? props.activate : '';
  if (param) {
    notification.open('positive', 'accountActivated');
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
  sendForm(form);
}

function sendForm(user: User) {
  store.login(user).then(
    () => {
      notification.open('positive', '');
      redirect();
    },
    (error) => {
      notification.open('negative', error);
    }
  );
  isSubmitting.value = false;
}

onMounted(() => {
  if (store.isLoggedIn) {
    redirect();
  }
});

function redirect() {
  if (lastUrl) {
    router.push(lastUrl as RouteLocationRaw);
  } else {
    router.push({ name: 'calendar' });
  }
}
</script>
