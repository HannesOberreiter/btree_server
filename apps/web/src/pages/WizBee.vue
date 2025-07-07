<script setup lang="ts">
import { ref } from 'vue';
import { useApiFetch } from '../composables/useApi';

import BtnBase from '../components/BtnBase.vue';
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

const currentLanguage = ref(LANGUAGES.find((l) => l.value === locale.value))!;

const question = ref('');
const lang = ref(currentLanguage);
const data = ref({
  text: '',
  savedTokens: 0,
  tokens: 0,
  refs: [] as any[],
});
const error = ref<string | undefined>(undefined);
const isFetching = ref(false);
const isStreaming = ref(false);
let breakStream = false;
const result = computed(() => {
  if (!data.value) return '';
  return data.value.text;
});

function onExampleQuestion(example: string) {
  question.value = example;
  onQuestion();
}

async function onQuestion() {
  error.value = undefined;
  if (isStreaming.value) {
    breakStream = true;
    isFetching.value = false;
    isStreaming.value = false;
  }

  isFetching.value = true;
  data.value.text = '....';
  const stream = api.stream('/v1/service/wizbee/ask/stream', {
    question: question.value,
    lang: lang.value?.value,
  });

  try {
    const responseStream = (await stream).body!;
    isStreaming.value = true;
    isFetching.value = false;
    const reader = responseStream.getReader();
    let chunks = '';
    let accumulated = '';

    reader.read().then(function processStream({ done, value }): any {
      if (breakStream) {
        breakStream = false;
        isStreaming.value = false;
        reader.cancel();
        return;
      }
      if (done) {
        isStreaming.value = false;
        return;
      }
      const decoded = new TextDecoder('utf-8').decode(value);
      accumulated += decoded;
      const responses = accumulated.split(/\}\s*\{/);
      let lastResponse = {} as any;

      for (let i = 0; i < responses.length; i++) {
        let response = responses[i];
        if (i !== 0) {
          response = '{' + response;
        }
        if (i !== responses.length - 1) {
          response = response + '}';
        }
        if (!response) {
          continue;
        }

        let json: any;
        try {
          json = JSON.parse(response);
        } catch (e) {
          console.error(e);
          accumulated = response;
          return reader.read().then(processStream);
        }

        if (json?.statusCode === 404) {
          error.value = t('error.noAnswer');
          return;
        } else if (json?.statusCode === 429) {
          error.value = t('error.tokenLimit');
          return;
        } else if (json?.statusCode === 402) {
          error.value = t('error.premium');
          return;
        }

        if (json?.text === undefined) {
          error.value = t('error.unknown');
          return;
        }

        chunks += json.text;
        lastResponse = json;
      }

      accumulated = '';
      data.value = {
        text: chunks,
        savedTokens: lastResponse.savedTokens,
        tokens: lastResponse.tokens,
        refs: lastResponse.refs,
      };
      return reader.read().then(processStream);
    });
  } catch (e) {
    console.error(e);
    isFetching.value = false;
    isStreaming.value = false;
    breakStream = false;
    error.value = t('error.unknown');
  }
}
</script>

<template>
  <div class="row justify-center q-mx-md">
    <div class="q-mb-md container-size">
      <div class="row justify-center vertical-middle q-mb-xs items-center">
        <!-- on dark mode inverse the logo color -->
        <img
          src="/wizbee/favicon-96x96.png"
          alt="WizBee Logo"
          height="50"
          class="q-mr-sm"
          :class="{ 'invert-colors': $q.dark.isActive }"
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
                :loading="isFetching"
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
    <q-card class="q-ma-sm container-size">
      <q-card-section v-if="error" class="text-bold bg-red-8 text-white">
        <q-icon name="fas fa-bug" size="xl" class="q-mr-md"></q-icon>
        {{ $t('error.unknown') }}
        <div class="text-weight-regular q-mt-sm">
          {{ error }}
        </div>
      </q-card-section>
      <q-card-section v-else class="text-bold">
        <q-input
          v-model="result"
          :label="$t('answer')"
          type="textarea"
          :autogrow="true"
          :readonly="true"
        />
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

    <div class="q-mb-md container-size">
      <div class="q-gutter-sm">
        <q-btn
          v-for="example in exampleQuestions"
          :key="example"
          no-caps
          outline
          size="sm"
          :loading="isFetching"
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

.invert-colors {
  filter: grayscale(1) invert(1);
}
</style>
