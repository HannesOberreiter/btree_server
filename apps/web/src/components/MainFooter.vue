<template>
  <q-toolbar dense style="max-height: 36px; min-height: 34px">
    <router-link
      v-if="data && !isFetching && !error"
      :to="{ name: 'news' }"
      class="text-white"
      style="text-decoration: none"
    >
      {{ $t('version') }}: {{ data[0].version }}
      <span v-if="!$q.platform.is.mobile"> [{{ data[0].date }}] </span>
    </router-link>
    <q-space></q-space>
    <strong>b.tree</strong>
    <q-space></q-space>
    <btn-base
      icon="fas fa-circle-question"
      size="sm"
      :aria-label="$t('help.name')"
      @click="showInfo = !showInfo"
      ><tooltip-base>{{ $t('help.name') }} (h)</tooltip-base></btn-base
    >
    <btn-share :show-path="true"></btn-share>
  </q-toolbar>
  <global-sound></global-sound>
  <dialog-hint v-model="showInfo" :hint="help"></dialog-hint>
</template>

<script setup lang="ts">
import { useKeyHelp } from '~/composables/useKey';
import { useFetch } from '@vueuse/core';

// const build_version = process.env.NPM_PACKAGE_VERSION;
const { isFetching, error, data }: any = useFetch(
  '/news.json?cache=' + Date.now()
)
  .get()
  .json();

const router = useRouter();
const help = computed(() => `help.${String(router.currentRoute.value.name)}`);
const showInfo = ref(false);

useKeyHelp(showInfo);
</script>
