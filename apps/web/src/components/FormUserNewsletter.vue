<template>
  <q-checkbox
    v-model="newsletter"
    color="primary"
    :true-value="true"
    :false-value="false"
  >
    <slot>
      {{ $t('newsletterText') }}
    </slot>
  </q-checkbox>
</template>

<script setup lang="ts">
const newsletter = ref(false);
</script>
