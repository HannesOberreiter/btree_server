<template>
  <btn-base
    v-close-popup
    :disable="!storeRouter.isPrevious"
    flat
    dense
    data-cy="btn-return"
    color="white"
    size="md"
    icon="fas fa-backward-step"
    :aria-label="$t('previousPage')"
    @click="
      router.replace({
        name: storeRouter.$state.previous as any,
        params: storeRouter.$state.params as any,
      })
    "
  >
    <tooltip-base anchor="bottom middle" self="top middle">
      {{ $t('previousPage') }}
    </tooltip-base>
  </btn-base>
</template>

<script setup lang="ts">
import { useRouterStore } from '~/stores/router';

import { useRouter } from 'vue-router';

const router = useRouter();
const storeRouter = useRouterStore();
</script>
