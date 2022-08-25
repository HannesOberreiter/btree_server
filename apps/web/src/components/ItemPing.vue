<template>
  <q-item class="text-caption">
    <q-item-section avatar>
      <q-icon name="fas fa-circle" :color="colorStatus">
        <tooltip-base> {{ $t('connectionStatus') }} </tooltip-base>
      </q-icon>
    </q-item-section>
    <q-item-section v-if="offlineServer">
      {{ $t('offlineServer') }}
    </q-item-section>
    <q-item-section v-else-if="onlineUser">
      <tooltip-base> {{ time }} ms </tooltip-base>
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
const time = ref(null);
const offlineServer = ref(true);
const onlineUser = useOnline();
const colorStatus = ref('green');

useIntervalFn(
  () => {
    ping();
  },
  1000 * 60 * 5,
  { immediateCallback: true }
);

function ping() {
  if (onlineUser.value) {
    api
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
}

function setTime(t: number) {
  time.value = round(t);
  colorStatus.value = time.value < 1000 ? 'green' : 'orange';
}
</script>
