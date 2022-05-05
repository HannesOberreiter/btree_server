<template>
  <q-item
    v-ripple
    :to="{
      name: link.route,
      params:
        link.route === 'setting-option' ? { option: 'checkup_types' } : {},
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
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
defineProps({
  link: {
    type: Object,
    required: true,
  },
});
</script>
