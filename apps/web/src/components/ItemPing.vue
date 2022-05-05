<template>
  <q-item>
    <q-item-section avatar>
      <q-icon name="fas fa-circle" :color="colorStatus">
        <q-tooltip> {{ $t('connectionStatus') }} </q-tooltip>
      </q-icon>
    </q-item-section>
    <q-item-section v-if="offlineServer">
      {{ $t('offlineServer') }}
    </q-item-section>
    <q-item-section v-else-if="onlineUser">
      <q-tooltip> {{ time }} ms </q-tooltip>
      {{ $t('online') }}
    </q-item-section>
    <q-item-section v-else> {{ $t('offlineUser') }}</q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { useApiFetch } from '~/composables/useApi';
import { useIntervalFn, useOnline } from '@vueuse/core';
import round from 'lodash-es/round';

const api = useApiFetch();
const { pause, resume } = useIntervalFn(
  async () => {
    await ping();
  },
  1000 * 10,
  { immediate: true }
);

const time = ref(null);
const offlineServer = ref(true);
const onlineUser = useOnline();
const colorStatus = ref('green');

async function ping() {
  if (onlineUser.value) {
    pause();
    await api
      .ping()
      .then((response) => {
        offlineServer.value = false;
        setTime(response);
      })
      .catch((e) => {
        colorStatus.value = 'red';
        offlineServer.value = true;
        console.error(e);
      });
  } else {
    colorStatus.value = 'red';
  }
  resume();
}

function setTime(t: number) {
  time.value = round(t);
  colorStatus.value = time.value < 1000 ? 'green' : 'orange';
}
</script>
