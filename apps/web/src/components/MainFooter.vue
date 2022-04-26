<template>
  <q-toolbar dense style="max-height: 30px; min-height: 30px">
    {{ $t('version') }}: {{ news.aaData[0].version }},
    {{ news.aaData[0].date }} &nbsp;
    <router-link :to="{ name: 'news' }" class="text-white">
      {{ $t('news') }}
    </router-link>
    <q-space></q-space>
    <strong>b.tree</strong>
  </q-toolbar>
  <global-sound></global-sound>
</template>

<script setup lang="ts">
import news from '~/assets/news.json';
</script>
