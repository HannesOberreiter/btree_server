<template>
  <div class="row content-center justify-around items-center">
    <div class="q-pa-md col-12 text-h7 text-center">Our Premium Supporter:</div>
    <div
      class="col-12 col-sm-6 col-md-5 col-lg-4 text-center"
      v-for="supporter in SUPPORTERS"
      :key="supporter.name"
    >
      <a :href="supporter.url">
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
const SUPPORTERS = [
  {
    name: 'Meteoblue',
    img: require('assets/supporter/meteoblue.png'),
    url: 'https://www.meteoblue.com/',
  },
  {
    name: 'Wiener Bezirksimkerei',
    img: require('assets/supporter/wiener-bezirksimkerei.png'),
    url: 'https://wiener-bezirksimkerei.at/',
  },
];
</script>
