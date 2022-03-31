<template>
  <q-card-section>
    <div class="text-h6 text-center">{{ t('signup.name') }}</div>
    <form-error-max v-if="submitCount >= 15"></form-error-max>
    <q-form v-else class="q-gutter-md" @submit="onSubmit">
      <form-input-company
        v-model="state.company"
        label="company.name"
        :max-valid="45"
        :min-valid="5"
        :required="true"
      >
        <template #deepPrepend
          ><q-icon name="fas fa-warehouse"></q-icon
        ></template>
      </form-input-company>
      <form-input-email v-model="state.email"></form-input-email>
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
        <template #prepend>
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
        <template #prepend>
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
          <q-btn flat color="secondary" @click="terms = true">
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
        <q-btn v-close-popup flat label="OK" color="primary" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { LANGUAGES } from '~/constants';
import { required, maxLength } from '~/helpers/i18n-validators';
import { useNotification } from '~/composables/useResponseText';
import { usePreferredLanguages } from '@vueuse/core';
import { validationErrors } from '~/helpers';
import AuthService from '~/services/auth.service';
import FormErrorMax from '~/components/FormErrorMax.vue';
import FormInputCompany from '~/components/FormInputText.vue';
import FormInputEmail from '~/components/FormInputEmail.vue';
import FormUserLanguage from '~/components/FormUserLanguage.vue';
import FormUserNewsletter from '~/components/FormUserNewsletter.vue';
import FormUserPassword from '~/components/FormUserPassword.vue';
import termsDE from '~/i18n/de/terms.txt?raw';
import termsEN from '~/i18n/en/terms.txt?raw';
import useVuelidate from '@vuelidate/core';

const notification = useNotification();
const { t } = useI18n();

const SOURCES = [
  {
    label: '-',
    value: 1,
  },
  {
    label: t('registerSources.recommended'),
    value: 2,
  },
  {
    label: t('registerSources.search'),
    value: 3,
  },
  {
    label: t('registerSources.socialMedia'),
    value: 4,
  },
  {
    label: t('registerSources.ads'),
    value: 5,
  },
  {
    label: t('registerSources.journal'),
    value: 6,
  },
  {
    label: t('registerSources.appStore'),
    value: 7,
  },
  {
    label: t('registerSources.other'),
    value: 0,
  },
];

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
    notification.open('negative', t('signup.accept'));
    isSubmitting.value = false;
    return;
  }
  submitCount.value++;
  const form: any = {
    company: state.company,
    email: state.email,
    password: state.password,
    lang: state.lang.value,
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
