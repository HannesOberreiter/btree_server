<template>
  <q-select
    v-model="lang"
    :options="LANGUAGES"
    option-value="value"
    option-label="label"
    :label="t('language')"
    filled
    :dense="true"
  >
    <template #prepend>
      <q-icon name="fas fa-language" />
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { LANGUAGES } from '~/constants';
import { usePreferredLanguages } from '@vueuse/core';

const { t } = useI18n();
const languages = usePreferredLanguages();

const lang = ref(languages.value[0] === 'de' ? LANGUAGES[1] : LANGUAGES[0]);
</script>
