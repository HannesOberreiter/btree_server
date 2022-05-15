<template>
  <q-td>
    <btn-base icon="far fa-calendar-xmark" @click="dialogEvent(id)"></btn-base>
  </q-td>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import DialogRearingEvent from './DialogRearingEvent.vue';
const $q = useQuasar();
defineProps({
  id: {
    type: Number,
    required: true,
  },
});
const dialogEvent = (id: number) => {
  $q.dialog({
    component: DialogRearingEvent,
    componentProps: {
      id: id,
    },
  });
};
</script>
