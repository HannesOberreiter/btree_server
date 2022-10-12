<template>
  <q-item
    v-ripple
    :data-cy="`route-${link.route}`"
    :to="{
      name: link.route,
      params: link.params ? link.params : {},
    }"
    clickable
    exact
    active-class="text-yellow"
  >
    <q-item-section avatar>
      <q-icon :name="link.icon" />
    </q-item-section>
    <q-item-section>
      {{ link.label }}
      {{ link.count ? `[${link.count}]` : '' }}
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
const $q = useQuasar();
defineProps({
  link: {
    type: Object,
    required: true,
  },
});

defineExpose({ $q });
</script>
