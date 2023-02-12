<template>
  <router-view />
</template>

<script setup lang="ts">
import { useMeta } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const router = useRouter();

useMeta(() => {
  return {
    title: router.currentRoute.value.meta.title
      ? t(router.currentRoute.value.meta.title as string) + ' - b.tree'
      : 'b.tree',
  };
});
</script>
