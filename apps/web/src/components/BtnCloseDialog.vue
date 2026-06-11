<script setup lang="ts">
import BtnBase from './BtnBase.vue';
</script>

<template>
  <BtnBase
    v-close-popup
    icon="fas fa-times"
    data-cy="btn-close-dialog"
    flat
    round
    dense
    class="print-hide"
  />
</template>
