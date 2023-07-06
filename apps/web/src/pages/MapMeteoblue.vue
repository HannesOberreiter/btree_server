<template>
  <GlobalLoading v-if="!finalCoords && !error"> </GlobalLoading>
  <iframe
    v-else
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
import { useGeolocation, watchOnce } from '@vueuse/core';
import { computed, ref } from 'vue';
import GlobalLoading from '~/components/GlobalLoading.vue';
import { useAuthUserStore } from '~/stores/auth';
const storeUser = useAuthUserStore();

const urlPart = computed(() =>
  storeUser.user.lang === 'de' ? 'de/wetter' : 'en/weather',
);

const { coords, error, pause } = useGeolocation({
  immediate: true,
  enableHighAccuracy: true,
  timeout: 1000 * 60 * 10,
});

const finalCoords = ref<GeolocationCoordinates>(null);

const referUrl = computed(() => {
  return `https://www.meteoblue.com/${urlPart.value}/maps/index?utm_source=weather_widget&utm_medium=linkus&utm_content=map&utm_campaign=Weather%2BWidget`;
});

watchOnce(coords, (val) => {
  if (val) pause();
  finalCoords.value = val;
});

const widgetUrl = computed(() => {
  if (finalCoords.value) {
    return `https://www.meteoblue.com/${urlPart.value}/maps/widget/${finalCoords.value.latitude}N${finalCoords.value.longitude}E?windAnimation=0&windAnimation=1&gust=0&gust=1&satellite=0&satellite=1&cloudsAndPrecipitation=0&cloudsAndPrecipitation=1&temperature=0&temperature=1&sunshine=0&sunshine=1&extremeForecastIndex=0&extremeForecastIndex=1&tempunit=C&windunit=km%252Fh&lengthunit=metric&zoom=8&autowidth=auto`;
  }
  return `https://www.meteoblue.com/${urlPart.value}/maps/widget?windAnimation=0&windAnimation=1&gust=0&gust=1&satellite=0&satellite=1&cloudsAndPrecipitation=0&cloudsAndPrecipitation=1&temperature=0&temperature=1&sunshine=0&sunshine=1&extremeForecastIndex=0&extremeForecastIndex=1&geoloc=detect&tempunit=C&windunit=km%252Fh&lengthunit=metric&zoom=8&autowidth=auto`;
});
</script>
