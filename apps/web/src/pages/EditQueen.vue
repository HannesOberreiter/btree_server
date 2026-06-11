<script setup lang="ts">
import FormMainQueen from '../components/FormMainQueen.vue';

defineProps({
  ids: {
    type: Array,
    required: true
  }
});
</script>

<template>
  <div class="row q-pa-sm justify-center">
    <div class="col-12 col-sm-10 col-md-8">
      <div class="text-h5 q-pb-sm text-center">
        {{ $t('edit') }} {{ $t('queen') }}
      </div>
      <FormMainQueen :ids="ids" />
    </div>
  </div>
</template>
