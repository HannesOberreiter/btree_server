<template>
  <q-checkbox
    v-model="newsletter"
    color="primary"
    :true-value="true"
    :false-value="false"
  >
    <slot>
      {{ t('newsletterText') }}
    </slot>
  </q-checkbox>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const newsletter = ref(false);
</script>
