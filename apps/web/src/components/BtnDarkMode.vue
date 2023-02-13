<template>
  <btn-base
    flat
    dense
    color="white"
    size="md"
    data-cy="btn-dark-mode"
    :icon="status.icon"
    :aria-label="$t(status.text)"
    @click="setDarkMode"
  >
    <tooltip-base anchor="bottom middle" self="top middle">
      {{ $t(status.text) }}
    </tooltip-base>
  </btn-base>
</template>

<script lang="ts" setup>
import { useColorMode } from '@vueuse/core';
import { useQuasar } from 'quasar';
import { computed, watch } from 'vue';

const $q = useQuasar();
const darkMode = useColorMode({
  storageKey: 'colorScheme',
  emitAuto: true,
});

const status = computed<{
  icon: string;
  text: string;
  status: 'auto' | boolean;
}>(() => {
  switch (darkMode.value) {
    case 'auto':
      return {
        icon: 'fas fa-robot',
        text: 'autoMode',
        status: 'auto',
      };
    case 'dark':
      return {
        icon: 'fas fa-moon',
        text: 'darkMode',
        status: true,
      };
    default:
      return {
        icon: 'fas fa-sun',
        text: 'dayMode',
        status: false,
      };
  }
});

const setDarkMode = () => {
  switch (darkMode.value) {
    case 'light':
      darkMode.value = 'dark';
      break;
    case 'dark':
      darkMode.value = 'auto';
      break;
    default:
      darkMode.value = 'light';
  }
};

watch(
  darkMode,
  () => {
    $q.dark.set(status.value.status);
  },
  { immediate: true }
);
</script>
