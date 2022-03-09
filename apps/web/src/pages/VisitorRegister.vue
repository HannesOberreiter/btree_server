<template>
  <q-card-section>
    <div class="text-h6 text-center">{{ t('signup.name') }}</div>
    <form-error-max v-if="submitCount >= 15"></form-error-max>
    <q-form v-else @submit="onSubmit" class="q-gutter-md">
      <form-user-company v-model="state.company"></form-user-company>
      <form-user-email v-model="state.email"></form-user-email>
      <form-user-password
        v-model:modelPassword="state.password"
        :confirm="true"
      ></form-user-password>
      <form-user-language v-model="state.lang"></form-user-language>

      <q-select
        v-model="v$.source.$model"
        :error="v$.source.$error"
        :error-messages="validationErrors(v$.source)"
        :options="SOURCES"
        option-value="value"
        option-label="label"
        hide-details
        :label="t('signup.source')"
        filled
        :dense="true"
      >
        <template v-slot:prepend>
          <q-icon name="fas fa-question" />
        </template>
      </q-select>

      <q-input
        v-show="state.source.value === SOURCES[7].value"
        v-model="v$.other.$model"
        :error="v$.other.$error"
        :error-message="validationErrors(v$.other)"
        :no-error-icon="true"
        :label="t('signupSource')"
        name="other"
        filled
      >
        <template v-slot:prepend>
          <q-icon name="fas fa-question-circle" />
        </template>
      </q-input>

      <q-checkbox
        v-model="v$.terms.$model"
        :error="v$.terms.$error"
        :error-messages="validationErrors(v$.terms)"
        color="primary"
        :true-value="true"
        :false-value="false"
      >
        <slot>
          {{ t('signup.agree') }}
          <q-btn @click="terms = true" flat color="secondary">
            {{ t('signup.terms') }}
          </q-btn>
        </slot>
      </q-checkbox>

      <form-user-newsletter v-model="state.newsletter"></form-user-newsletter>

      <q-card-actions>
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
        <div class="text-center text-primary">
          {{ t('signup.hintPremium') }}
        </div>
      </q-card-actions>
    </q-form>
    <p v-if="message" class="text-primary text-center">
      {{ message }}
    </p>
  </q-card-section>
  <q-dialog v-model="terms">
    <q-card>
      <q-card-section>
        <div class="text-h6">{{ t('signup.terms') }}</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        {{ state.lang.value == 'de' ? termsDE : termsEN }}
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="OK" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { required, maxLength } from '../helpers/i18n-validators';
import { reactive, ref } from 'vue';
import AuthService from '../services/auth.service';
import { validationErrors } from '../helpers';
import { LANGUAGES, SOURCES } from '../constants';
import { usePreferredLanguages } from '@vueuse/core';
import { useNotification } from '../composables/useResponseText';
import { useI18n } from 'vue-i18n';
import { terms as termsDE } from '../i18n/de/terms';
import { terms as termsEN } from '../i18n/en/terms';
import FormErrorMax from 'src/components/FormErrorMax.vue';
import FormUserEmail from 'src/components/FormUserEmail.vue';
import FormUserPassword from 'src/components/FormUserPassword.vue';
import FormUserCompany from '../components/FormUserCompany.vue';
import FormUserLanguage from 'src/components/FormUserLanguage.vue';
import FormUserNewsletter from 'src/components/FormUserNewsletter.vue';

const notification = useNotification();
const { t } = useI18n();

const terms = ref(false);
const message = ref('');
const btnLabel = ref(t('signup.name'));
const isSubmitting = ref(false);
const submitCount = ref(0);
const languages = usePreferredLanguages();

const state = reactive({
  company: '',
  email: '',
  password: '',
  confirmPassword: '',
  lang: languages.value[0] === 'de' ? LANGUAGES[1] : LANGUAGES[0],
  source: SOURCES[0],
  other: '',
  terms: false,
  newsletter: false,
});
const rules = reactive({
  other: { maxLengthValue: maxLength(45) },
  source: { required },
  terms: { required },
});
const v$ = useVuelidate(rules, state);

async function onSubmit() {
  isSubmitting.value = true;
  const isFormCorrect = await v$.value.$validate();

  if (!isFormCorrect) {
    isSubmitting.value = false;
    return;
  }
  if (state.terms === false) {
    notification.open('negative', t('singup.accept'));
    isSubmitting.value = false;
    return;
  }
  submitCount.value++;
  const form: any = {
    company: state.company,
    email: state.email,
    password: state.password,
    lang: state.lang.value,
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    source: state.source.value === 0 ? state.other : state.source + '',
    newsletter: state.newsletter,
  };
  await sendForm(form);
  return;
}

async function sendForm(user: any) {
  await AuthService.register(user).then(
    (data) => {
      const email = data.data.email as string;
      message.value = t('signup.success', { msg: email });

      isSubmitting.value = false;
      btnLabel.value = t('success');
      notification.open('positive', message.value);
    },
    (error) => {
      notification.open('negative', error.response);
      isSubmitting.value = false;
    }
  );
}
</script>
