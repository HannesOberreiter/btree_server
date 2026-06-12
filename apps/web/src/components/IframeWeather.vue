<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, toRef } from 'vue';
import { useAuthUserStore } from '../stores/auth';

const props = defineProps({
  latlng: {
    type: Object,
    required: true
  }
});

const storeUser = useAuthUserStore();

const $q = useQuasar();
const latlng = toRef(props, 'latlng');

const urlPart = computed(() =>
  storeUser.user.lang === 'de' ? 'de/wetter' : 'en/weather'
);
const darkMode = computed(() => ($q.dark.isActive ? 'dark' : 'bright'));

const location = computed(
  () => `${latlng.value.latitude}N${latlng.value.longitude}E`
);

const referUrl = computed(() => {
  return `https://www.meteoblue.com/${urlPart.value}/woche/svalbard-airport%2c-longyear_spitzbergen-und-jan-mayen_6296766?utm_source=weather_widget&utm_medium=linkus&utm_content=three&utm_campaign=Weather%2BWidget`;
});

const widgetUrl = computed(() => {
  return `https://www.meteoblue.com/${urlPart.value}/widget/three/${location.value}?geoloc=fixed&nocurrent=0&nocurrent=1&noforecast=0&days=7&tempunit=CELSIUS&windunit=KILOMETER_PER_HOUR&layout=${darkMode.value}`;
});
</script>

<template>
  <iframe
    :src="widgetUrl"
    frameborder="0"
    scrolling="NO"
    allowtransparency="true"
    sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
    style="width: 805px; height: 528px"
  />
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
