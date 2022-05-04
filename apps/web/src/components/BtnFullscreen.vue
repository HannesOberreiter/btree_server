<template>
  <btn-base
    v-if="!$q.platform.is.mobile"
    flat
    dense
    color="white"
    size="md"
    :icon="$q.fullscreen.isActive ? 'fas fa-compress' : 'fas fa-expand'"
    @click="$q.fullscreen.toggle()"
  />
</template>
