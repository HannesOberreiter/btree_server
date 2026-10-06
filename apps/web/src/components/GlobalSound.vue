<script setup lang="ts">
import { useNetwork, useVibrate } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import ErrorSound from '../assets/audio/error.mp3';
import SuccessSound from '../assets/audio/success.mp3';
import { useNotification } from '../composables/useNotification';
import { useAuthUserStore } from '../stores/auth';

const { vibrate, isSupported: isVibrationSupported } = useVibrate({
  pattern: [100]
});
const storeUser = useAuthUserStore();
const { user } = storeToRefs(storeUser);
const notification = useNotification();
const network = useNetwork();
const errorSound = ref<null | HTMLAudioElement>(null);
const successSound = ref<null | HTMLAudioElement>(null);
const lastSoundNotification = ref(Date.now());

function preventSoundNotification(old: number, seconds = 1) {
  /* Do not play sound notifications when offline */
  if (network.isSupported.value && network.isOnline.value === false) {
    return true;
  }
  // if less than 5 seconds ago we stop any new sound notifications
  return (Math.abs(old - Date.now()) / 1000) % 60 < seconds;
}

watch(notification.state, currentValue => {
  if (currentValue.show !== true || !user.value.sound) {
    notification.close();
    return;
  }

  if (
    !lastSoundNotification.value ||
    preventSoundNotification(lastSoundNotification.value)
  ) {
    notification.close();
    return;
  }

  // Handle vibration
  if (isVibrationSupported) {
    vibrate(currentValue.error ? 300 : 100);
  }

  // Handle sound
  const soundElement = currentValue.error
    ? errorSound.value
    : successSound.value;
  if (soundElement) {
    soundElement.play();
  }

  lastSoundNotification.value = Date.now();
  notification.close();
});
</script>

<template>
  <div>
    <audio ref="successSound" :src="SuccessSound" preload="auto" />
    <audio ref="errorSound" :src="ErrorSound" preload="auto" />
  </div>
</template>
