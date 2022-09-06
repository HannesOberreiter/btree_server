<template>
  <router-view />
</template>

<script setup lang="ts">
import { useMeta } from 'quasar';

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
