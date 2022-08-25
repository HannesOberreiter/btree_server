<template>
  <btn-base
    flat
    dense
    color="white"
    size="md"
    data-cy="btn-dark-mode"
    :icon="$q.dark.isActive ? 'fas fa-moon' : 'fas fa-sun'"
    @click="setDarkMode"
  >
    <tooltip-base
      v-if="$q.dark.isActive"
      anchor="bottom middle"
      self="top middle"
    >
      {{ $t('darkMode') }}
    </tooltip-base>
    <tooltip-base anchor="bottom middle" self="top middle" else>
      {{ $t('dayMode') }}
    </tooltip-base>
  </btn-base>
</template>

<script lang="ts" setup>
import { useStorage } from '@vueuse/core';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const darkMode = useStorage('darkMode', false);

const setDarkMode = () => {
  darkMode.value = !darkMode.value;
  $q.dark.set(darkMode.value);
};

onMounted(() => $q.dark.set(darkMode.value));
</script>
