<script setup lang="ts">
import { ref } from 'vue';
import { useApiFetch } from '~/composables/useApi';

import BtnBase from '~/components/BtnBase.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const api = useApiFetch();
const { t, locale } = useI18n();

const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'Deutsch', value: 'de' },
  { label: 'Français', value: 'fr' },
  { label: 'Italiano', value: 'it' },
];

const exampleQuestions = [
  t('exampleQuestion.offline'),
  t('exampleQuestion.premium'),
  t('exampleQuestion.option'),
  t('exampleQuestion.eggs'),
  t('exampleQuestion.diffDiseases'),
];

const currentLanguage = ref(LANGUAGES.find((l) => l.value === locale.value));

const question = ref('');
const lang = ref(currentLanguage);
const data = ref(null);
const error = ref(null);
const isFetching = ref(false);
const result = computed(() => {
  if (!data.value) return '';
  return data.value.text;
});

function onExampleQuestion(example: string) {
  question.value = example;
  onQuestion();
}

async function onQuestion() {
  data.value = undefined;
  error.value = undefined;
  isFetching.value = true;
  api
    .post('/v1/service/wizbee/ask', {
      question: question.value,
      lang: lang.value.value,
    })
    .then((res) => {
      // if no choice is returned by chatGPT
      if (res?.text === undefined) {
        data.value = undefined;
        error.value = t('error.unknown');
        return;
      }
      data.value = res;
      error.value = undefined;
    })
    .catch((err) => {
      console.error(err);
      data.value = undefined;
      if (err?.statusCode === 404) {
        error.value = t('error.noAnswer');
        return;
      } else if (err?.statusCode === 429) {
        error.value = t('error.tokenLimit');
        return;
      } else if (err?.statusCode === 402) {
        error.value = t('error.premium');
        return;
      }
      error.value = t('error.unknown');
    })
    .finally(() => {
      isFetching.value = false;
    });
}
</script>

<template>
  <div class="row justify-center q-mx-md">
    <div class="q-mb-md container-size">
      <div class="row justify-center vertical-middle q-mb-xs items-center">
        <img
          src="
      /wizbee/favicon-96x96.png"
          alt="WizBee Logo"
          height="50"
          class="q-mr-sm"
        />
        <div class="text-h5">{{ $t('ask') }} WizBee</div>
      </div>
      <q-form class="q-mt-sm" @submit="(e) => e.preventDefault()">
        <div class="row">
          <q-input
            v-model="question"
            :placeholder="$t('askQuestion')"
            :minlength="3"
            :maxlength="1000"
            :clearable="true"
            class="full-width"
          >
            <template #after>
              <BtnBase
                icon="fas fa-question"
                type="submit"
                color="positive"
                square
                size="md"
                @click="onQuestion()"
              />
              <q-select
                v-model="lang"
                filled
                dense
                square
                :options="LANGUAGES"
                option-value="value"
                option-label="label"
              />
            </template>
          </q-input>
        </div>
      </q-form>
    </div>
  </div>
  <div class="row justify-center">
    <q-card v-if="isFetching" flat class="q-ma-sm container-size">
      <q-spinner-dots size="4em" />
    </q-card>

    <q-card v-if="data" class="q-ma-sm container-size">
      <q-card-section class="text-bold"> {{ $t('answer') }}: </q-card-section>
      <q-card-section>
        {{ result }}
      </q-card-section>
      <q-card-section class="bg-grey-8 text-white">
        <div>
          <b>{{ $t('countTokensLeft') }}:</b>
          {{ data?.savedTokens }} (-{{ data?.tokens }})
        </div>
        <div>
          <b> {{ $t('reference', data?.refs?.length) }}: </b>
        </div>
        <ul>
          <li v-for="meta in data?.refs" :key="meta.reference">
            <a :href="meta.link" class="text-white" target="_blank">
              {{ meta.reference }} ({{ Math.round((1 - meta.score) * 100) }}%)
            </a>
          </li>
        </ul>
      </q-card-section>
    </q-card>

    <q-card v-if="error" class="bg-red-8 text-white q-ma-sm container-size">
      <q-card-section class="text-bold">
        <q-icon name="fas fa-bug" size="xl" class="q-mr-md"></q-icon>
        {{ $t('error.unknown') }}
      </q-card-section>
      <q-card-section class="">
        {{ error }}
      </q-card-section>
    </q-card>

    <div v-if="!isFetching" class="q-mb-md container-size">
      <div class="q-gutter-sm">
        <q-btn
          v-for="example in exampleQuestions"
          :key="example"
          no-caps
          outline
          size="sm"
          @click="onExampleQuestion(example)"
        >
          {{ example }}
        </q-btn>
      </div>
    </div>

    <small class="text-grey-7 container-size">
      {{ $t('help.wizbee') }}
      <br />
      API Service:
      <a href="https://openai.com/" target="_blank">https://openai.com/</a>
    </small>
  </div>
</template>

<style>
.container-size {
  min-width: 80%;
  max-width: 600px;
}
</style>
