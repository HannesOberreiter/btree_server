<template>
  <div class="row content-center justify-around items-center">
    <div class="q-pa-md col-12 text-h7 text-center">
      {{ $t('premiumSupporter') }}:
    </div>
    <div
      v-for="supporter in SUPPORTERS"
      :key="supporter.name"
      class="col-12 col-sm-6 col-md-5 col-lg-4 text-center"
    >
      <a :href="supporter.url" target="_blank" rel="external noopener">
        <q-img
          :alt="supporter.name"
          :src="supporter.img"
          spinner-color="white"
          style="max-width: 120px"
        />
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import ImageMeteoblue from '~/assets/supporter/meteoblue.png';
import ImageWB from '~/assets/supporter/wiener-bezirksimkerei.png';

const SUPPORTERS = [
  {
    name: 'Meteoblue',
    img: ImageMeteoblue,
    url: 'https://www.meteoblue.com/',
  },
  {
    name: 'Wiener Bezirksimkerei',
    img: ImageWB,
    url: 'https://wiener-bezirksimkerei.at/',
  },
];
</script>
