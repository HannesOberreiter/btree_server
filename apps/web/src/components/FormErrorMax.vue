<template>
  <p class="text-negative text-center">
    {{ t('formMaxCount') }}
  </p>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
</script>
