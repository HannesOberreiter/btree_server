<template>
  <div
    class="fullscreen bg-blue-grey-8 text-white text-center q-pa-md flex flex-center"
  >
    <div>
      <div style="font-size: 20vh">404</div>

      <div class="text-h2" style="opacity: 0.6">{{ $t('error404') }}</div>

      <btn-base
        class="q-mt-xl"
        size="lg"
        color="black"
        text-color="white"
        to="/"
        :label="$t('login')"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import BtnBase from '../components/BtnBase.vue';
</script>
