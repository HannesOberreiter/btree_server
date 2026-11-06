<script setup lang="ts">
import FormMainHive from '../components/FormMainHive.vue';
</script>

<template>
  <div class="row q-pa-sm justify-center">
    <div class="col-12 col-sm-10 col-md-8">
      <div class="text-h5 q-pb-sm text-center">
        {{ $t('add') }} {{ $t('hive') }}
      </div>
      <FormMainHive />
    </div>
  </div>
</template>
