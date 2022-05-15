<template>
  <iframe
    :src="widgetUrl"
    frameborder="0"
    scrolling="NO"
    allowtransparency="true"
    sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
    style="width: 100%; height: 90vh"
  ></iframe>
  <div>
    <!-- DO NOT REMOVE THIS LINK -->
    <a
      :href="referUrl"
      target="_blank"
      rel="noopener"
      :style="$q.dark.isActive ? 'color: white;' : ''"
    >
      meteoblue
    </a>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthUserStore } from '~/stores/auth';
const storeUser = useAuthUserStore();

const urlPart = computed(() =>
  storeUser.user.lang === 'de' ? 'de/wetter' : 'en/weather'
);

const referUrl = computed(() => {
  return `https://www.meteoblue.com/${urlPart.value}/maps/index?utm_source=weather_widget&utm_medium=linkus&utm_content=map&utm_campaign=Weather%2BWidget`;
});

const widgetUrl = computed(() => {
  return `https://www.meteoblue.com/${urlPart.value}/maps/widget?windAnimation=0&windAnimation=1&gust=0&gust=1&satellite=0&satellite=1&geoloc=detect&tempunit=C&windunit=km%252Fh&lengthunit=metric&zoom=5&autowidth=auto`;
});
</script>
