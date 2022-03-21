<template>
  <iframe
    :src="`https://www.meteoblue.com/${url}/maps/widget?windAnimation=0&windAnimation=1&gust=0&gust=1&satellite=0&satellite=1&geoloc=detect&tempunit=C&windunit=km%252Fh&lengthunit=metric&zoom=5&autowidth=auto`"
    frameborder="0"
    scrolling="NO"
    allowtransparency="true"
    sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
    style="width: 100%; height: 90vh"
  ></iframe>
  <div>
    <!-- DO NOT REMOVE THIS LINK --><a
      :href="`https://www.meteoblue.com/${url}/maps/index?utm_source=weather_widget&utm_medium=linkus&utm_content=map&utm_campaign=Weather%2BWidget`"
      target="_blank"
      rel="noopener"
      >meteoblue</a
    >
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthUserStore } from '~/stores/auth';
const storeUser = useAuthUserStore();
const url = computed(() =>
  storeUser.user.lang === 'de' ? 'de/wetter' : 'en/weather'
);
</script>
