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
    <btn-share :show-path="true"></btn-share>
  </q-toolbar>
  <global-sound></global-sound>
</template>

<script setup lang="ts">
import news from '~/assets/news.json';
</script>
