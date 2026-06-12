<script setup lang="ts">
import FormMainMovement from '../components/FormMainMovement.vue';
</script>

<template>
  <div class="row q-pa-sm justify-center">
    <div class="col-12 col-sm-10 col-md-8">
      <div class="text-h5 q-pb-sm text-center">
        {{ $t('new') }} {{ $t('movement') }}
      </div>
      <FormMainMovement />
    </div>
  </div>
</template>
