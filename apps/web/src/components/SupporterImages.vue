<script setup lang="ts">
import ImageTouchad from '../assets/supporter/touchad.png';
import ImageWB from '../assets/supporter/wiener-bezirksimkerei.png';

const SUPPORTERS = [
  {
    name: 'TouchAd',
    alt: 'TouchAd digitale Werbung Dienstleister',
    img: ImageTouchad,
    url: 'https://touchad.at/'
  },
  {
    name: 'Wiener Bezirksimkerei',
    alt: 'Bezirksimkerei. Honig aus meiner Stadt. Die Wiener Bezirksimkerei erzeugt biologische Lagenhonige in allen Wiener Gemeindebezirken.',
    img: ImageWB,
    url: 'https://wiener-bezirksimkerei.at/'
  }
];
</script>

<template>
  <div class="row content-center justify-around items-center">
    <div class="q-pa-md col-12 text-h7 text-center">
      {{ $t('premiumSupporter') }}:
    </div>
    <div
      v-for="supporter in SUPPORTERS"
      :key="supporter.name"
      class="col-12 col-sm-6 col-md-5 col-lg-4 text-center q-pb-lg"
    >
      <a :href="supporter.url" target="_blank" rel="external noopener">
        <q-img
          :alt="supporter.alt"
          :src="supporter.img"
          spinner-color="white"
          loading="lazy"
          style="max-width: 120px"
        />
      </a>
    </div>
  </div>
</template>
