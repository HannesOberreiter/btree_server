<template>
  <q-td>
    <router-link
      :to="{ name: `detail-${link}`, params: { id: id } }"
      class="text-bold"
      style="text-decoration: none; color: inherit"
    >
      {{ label }}
    </router-link>
  </q-td>
</template>

<script lang="ts">
import type { PropType } from 'vue';
type Link = 'hive' | 'apiary' | 'queen';
</script>

<script setup lang="ts">
import { RouterLink } from 'vue-router';

defineProps({
  id: {
    type: [Number, String],
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  link: {
    type: String as PropType<Link>,
    required: true,
  },
});
</script>
