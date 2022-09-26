<template>
  <div class="row content-center justify-around items-center">
    <div class="q-pa-md col-12 text-h7 text-center">
      {{ $t('serviceProvider') }}:
    </div>
    <div
      v-for="service in SERVICES"
      :key="service.name"
      class="col-12 col-sm-6 col-md-5 col-lg-4 text-center"
    >
      <a :href="service.url" target="_blank" rel="external noopener">
        <q-img
          :alt="service.alt"
          :src="service.img"
          spinner-color="white"
          style="max-width: 120px"
        />
      </a>
    </div>
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
          :alt="supporter.alt"
          :src="supporter.img"
          spinner-color="white"
          style="max-width: 120px"
        />
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import ImageHetzner from '~/assets/supporter/hetzner.svg';
import ImageMeteoblue from '~/assets/supporter/meteoblue.png';
import ImageWB from '~/assets/supporter/wiener-bezirksimkerei.png';

const SERVICES = [
  {
    name: 'Hetzner',
    alt: 'Hetzner Online GmbH is a company and data center operator based in Gunzenhausen, Germany',
    img: ImageHetzner,
    url: 'https://hetzner.cloud/?ref=gphXYt4v7MQw',
  },
  {
    name: 'Meteoblue',
    alt: 'Meteoblue is a meteorological service created at the University of Basel, Switzerland. In 2006, Meteoblue was then founded as a spin-off company in order to serve customers especially in the area of agriculture as well as solar and wind power.',
    img: ImageMeteoblue,
    url: 'https://www.meteoblue.com/',
  },
];

const SUPPORTERS = [
  {
    name: 'Wiener Bezirksimkerei',
    alt: 'Bezirksimkerei. Honig aus meiner Stadt. Die Wiener Bezirksimkerei erzeugt biologische Lagenhonige in allen Wiener Gemeindebezirken.',
    img: ImageWB,
    url: 'https://wiener-bezirksimkerei.at/',
  },
];
</script>
