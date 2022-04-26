<template>
  <q-form @submit.prevent.stop="onSubmit">
    <div class="row">
      <div class="col-6 q-pr-sm">
        <form-input-text
          v-model="state.firstname"
          label="firstname"
          :max-valid="45"
        >
        </form-input-text>
      </div>
      <div class="col-6">
        <form-input-text
          v-model="state.lastname"
          label="lastname"
          :max-valid="45"
        >
        </form-input-text>
      </div>
      <div class="col-12">
        <form-user-language v-model="state.lang"></form-user-language>
      </div>
      <div class="col-12">
        <form-user-newsletter v-model="state.newsletter"></form-user-newsletter>
      </div>
      <div class="col-12">
        <q-checkbox
          v-model="state.sound"
          color="primary"
          :true-value="true"
          :false-value="false"
        >
          <slot>
            {{ t('soundHint') }}
          </slot>
        </q-checkbox>
      </div>
      <div class="col-12">
        <q-checkbox
          v-model="state.acdate"
          color="primary"
          :true-value="true"
          :false-value="false"
        >
          <slot>
            {{ t('visHint') }}
          </slot>
        </q-checkbox>
      </div>
    </div>
  </q-form>
  <btn-base-group>
    <btn-base
      size="md"
      color="secondary"
      type="submit"
      :loading="isSubmitting"
      :label="t('save')"
      @click="onSubmit"
    />
    <btn-base
      size="md"
      color="negative"
      :loading="isSubmitting"
      :label="t('delete') + ' ' + t('account')"
      @click="onDelete"
    />
  </btn-base-group>
</template>

<script setup lang="ts">
import { LANGUAGES } from '~/constants';
import { required } from '~/helpers/i18n-validators';
import { useAuthUserStore } from '~/stores/auth';
import { useNotification } from '~/composables/useNotification';
import { useQuasarLang } from '~/composables/useQuasarLang';
import useVuelidate from '@vuelidate/core';
import { useApiFetch } from '~/composables/useApi';
import { useQuasar } from 'quasar';

const { t } = useI18n();
const $q = useQuasar();
const api = useApiFetch();
const notification = useNotification();
const storeUser = useAuthUserStore();
const { user } = storeToRefs(storeUser);
const isSubmitting = ref(false);

const state = reactive({
  firstname: user.value.firstname || '',
  lastname: user.value.lastname || '',
  format: user.value.format || '',
  lang: user.value.lang === 'de' ? LANGUAGES[1] : LANGUAGES[0],
  sound: user.value.sound,
  newsletter: user.value.newsletter,
  acdate: user.value.acdate,
});

const rules = {
  lang: {
    required,
  },
  sound: {},
  acdate: {},
};
const v = useVuelidate(rules, state, { $autoDirty: true });

async function onSubmit() {
  isSubmitting.value = true;
  const isFormCorrect = await v.value.$validate();
  if (!isFormCorrect) {
    isSubmitting.value = false;
    return;
  }
  const data = {
    firstname: state.firstname,
    lastname: state.lastname,
    lang: state.lang.value,
    sound: state.sound,
    acdate: state.acdate,
  };
  await api.patch('/v1/user', data).then(
    (response: any) => {
      useAuthUserStore().refresh(response);
      useQuasarLang($q);
      notification.open('positive', '');
    },
    (error) => {
      notification.open('negative', error);
    }
  );
  isSubmitting.value = false;
}

const onDelete = () => {
  isSubmitting.value = true;

  $q.dialog({
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    title: t('delete') + ' ' + user.value.email,
    message: t('profile.userDeleteText'),
    cancel: true,
    persistent: false,
    prompt: {
      model: '',
      isValid: (val) => val.length > 4 && val.length <= 100,
      type: 'password',
      label: t('password'),
    },
  })
    .onOk((value) => {
      api.patch('/v1/user/delete', { password: value }).then(
        async (_response: any) => {
          notification.open('positive', '');
          await storeUser.logout();
        },
        (error) => {
          notification.open('negative', error);
        }
      );
    })
    .onDismiss(() => (isSubmitting.value = false));
};
</script>
