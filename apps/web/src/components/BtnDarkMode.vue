<template>
  <btn-base
    flat
    dense
    color="white"
    size="md"
    :icon="$q.dark.isActive ? 'fas fa-moon' : 'fas fa-sun'"
    @click="$q.dark.toggle()"
  />
</template>
