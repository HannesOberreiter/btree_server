<script setup lang="ts">
import { useIntervalFn, useOnline } from '@vueuse/core';
import round from 'lodash-es/round';
import { computed, ref } from 'vue';
import { useApiFetch } from '../composables/useApi';
import { useBackend } from '../composables/useBackend';
import TooltipBase from './TooltipBase.vue';

const api = useApiFetch();
const time = ref<number>(0);
const offlineServer = ref(true);
const onlineUser = useOnline();
const colorStatus = ref('green');
const baseUrl = useBackend();
const pingTimer = computed(() => {
  if (offlineServer.value) {
    return 1000 * 15;
  }
  return 1000 * 60 * 5;
});

useIntervalFn(
  () => {
    ping();
  },
  pingTimer,
  { immediateCallback: true }
);

function ping() {
  if (onlineUser.value) {
    api
      .ping()
      .then(response => {
        offlineServer.value = false;
        setTime(response);
      })
      .catch(e => {
        colorStatus.value = 'red';
        offlineServer.value = true;
        console.error(e);
      });
  } else {
    colorStatus.value = 'red';
  }
}

function setTime(t: number) {
  time.value = round(t);
  colorStatus.value = time.value < 1000 ? 'green' : 'orange';
}
</script>

<template>
  <q-item class="text-caption">
    <q-item-section avatar>
      <q-icon name="fas fa-circle" :color="colorStatus">
        <TooltipBase> {{ $t('connectionStatus') }} </TooltipBase>
      </q-icon>
    </q-item-section>
    <q-item-section v-if="offlineServer">
      {{ $t('offlineServer') }}
    </q-item-section>
    <q-item-section v-else-if="onlineUser">
      <TooltipBase> {{ time }} ms ({{ baseUrl.url }}) </TooltipBase>
      {{ $t('online') }}
    </q-item-section>
    <q-item-section v-else>
      {{ $t('offlineUser') }}
    </q-item-section>
  </q-item>
</template>
