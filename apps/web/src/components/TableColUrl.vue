<template>
  <q-td>
    <div
      v-if="value"
      style="cursor: pointer"
      @click="showFile(value as string)"
    >
      {{ value }}
    </div>
  </q-td>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import DialogFileShow from './DialogFileShow.vue';

const $q = useQuasar();

defineProps({
  value: {
    required: true,
  },
});

const showFile = (value: string) => {
  if (value && value !== '') {
    $q.dialog({
      component: DialogFileShow,
      componentProps: {
        value: value,
      },
    });
  }
};
</script>
