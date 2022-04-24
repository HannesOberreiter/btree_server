<template>
  <q-td>
    <div class="cursor: pointer" @click="showFile(value)">{{ value }}</div>
  </q-td>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import DialogFileShow from './DialogFileShow.vue';

const $q = useQuasar();

defineProps({
  value: {
    type: String,
    required: true,
  },
});

const showFile = (value: string) => {
  if (value && value !== '') {
    let values = [];
    if (value.includes('www.btree.at')) {
      // Legacy, new app has no option to upload on my own server
      values[0] = 'btree';
      values[1] = value;
    } else {
      // https://stackoverflow.com/a/4607799/5316675
      values = value.split(/:(.*)/s);
    }
    $q.dialog({
      component: DialogFileShow,
      componentProps: {
        service: values[0],
        id: values[1],
      },
    });
  }
};
</script>
