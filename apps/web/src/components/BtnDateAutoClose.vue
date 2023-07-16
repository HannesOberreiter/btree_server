<template>
  <btn-base
    class="q-mr-xl"
    color="secondary"
    size="sm"
    flat
    :icon="state['date-auto-close'] ? 'fas fa-robot' : 'fas fa-hand'"
    @click="() => (state['date-auto-close'] = !state['date-auto-close'])"
  >
    <tooltip-base>
      {{ $t('autoCloseDate') }}
    </tooltip-base>
  </btn-base>
</template>

<script lang="ts" setup>
import { useLocalStorage } from '@vueuse/core';
import { watch } from 'vue';

const emit = defineEmits(['change']);
const state = useLocalStorage(
  'pref-local',
  { 'date-auto-close': false },
  { mergeDefaults: true },
);

watch(state.value, () => emit('change', state.value['date-auto-close']), {
  immediate: true,
});
</script>
