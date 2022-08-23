<template>
  <q-toolbar dense style="max-height: 30px; min-height: 30px">
    <router-link
      :to="{ name: 'news' }"
      class="text-white"
      style="text-decoration: none"
    >
      {{ $t('version') }}: {{ news.aaData[0].version }}
      <span v-if="!$q.platform.is.mobile"> [{{ news.aaData[0].date }}] </span>
    </router-link>
    <q-space></q-space>
    <strong>b.tree</strong>
    <q-space></q-space>
    <btn-base
      icon="fas fa-circle-question"
      size="sm"
      @click="showInfo = !showInfo"
      ><tooltip-base>{{ $t('help.name') }} (h)</tooltip-base></btn-base
    >
    <btn-share :show-path="true"></btn-share>
  </q-toolbar>
  <global-sound></global-sound>
  <dialog-hint v-model="showInfo" :hint="help"></dialog-hint>
</template>

<script setup lang="ts">
import news from '~/assets/news.json';
import { useKeyHelp } from '~/composables/useKey';

const router = useRouter();
const help = computed(() => `help.${String(router.currentRoute.value.name)}`);
const showInfo = ref(false);

useKeyHelp(showInfo);
</script>
