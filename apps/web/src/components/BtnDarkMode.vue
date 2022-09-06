<template>
  <btn-base
    flat
    dense
    color="white"
    size="md"
    data-cy="btn-dark-mode"
    :icon="icon"
    @click="setDarkMode"
  >
    <tooltip-base anchor="bottom middle" self="top middle">
      {{ $t(text) }}
    </tooltip-base>
  </btn-base>
</template>

<script lang="ts" setup>
import { useStorage } from '@vueuse/core';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const darkMode = useStorage<'auto' | boolean>('darkMode', 'auto');

const icon = computed(() => {
  switch ($q.dark.mode) {
    case 'auto':
      return 'fas fa-robot';
    case true:
      return 'fas fa-moon';
    default:
      return 'fas fa-sun';
  }
});

const text = computed(() => {
  switch ($q.dark.mode) {
    case 'auto':
      return 'autoMode';
    case true:
      return 'darkMode';
    default:
      return 'dayMode';
  }
});

const setDarkMode = () => {
  switch (darkMode.value) {
    case 'auto':
      darkMode.value = true;
      break;
    case true:
      darkMode.value = false;
      break;
    default:
      darkMode.value = 'auto';
  }
  $q.dark.set(darkMode.value);
};

onMounted(() => $q.dark.set(darkMode.value));
</script>
