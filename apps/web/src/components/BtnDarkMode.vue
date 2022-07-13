<template>
  <btn-base
    flat
    dense
    color="white"
    size="md"
    data-cy="btn-dark-mode"
    :icon="$q.dark.isActive ? 'fas fa-moon' : 'fas fa-sun'"
    @click="$q.dark.toggle()"
  >
    <q-tooltip v-if="$q.dark.isActive">{{ $t('darkMode') }}</q-tooltip>
    <q-tooltip else>{{ $t('dayMode') }}</q-tooltip>
  </btn-base>
</template>
