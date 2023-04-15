<template>
  <q-btn :no-caps="true" :unelevated="true" class="print-hide no-wrap">
    <slot></slot>
  </q-btn>
</template>
<style scoped>
.no-wrap {
  white-space: nowrap;
}
</style>
