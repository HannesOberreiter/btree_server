<template>
  <q-td>
    <router-link
      :to="`detail/${link}/${id}`"
      class="text-bold"
      style="text-decoration: none; color: inherit"
    >
      {{ label }}
    </router-link>
  </q-td>
</template>

<script lang="ts">
import { PropType } from 'vue';
type Link = 'hive' | 'apiary' | 'queen';
</script>

<script setup lang="ts">
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
