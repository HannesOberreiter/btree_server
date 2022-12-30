<template>
  <div v-if="user.sound">
    <audio ref="successSound" :src="SuccessSound" preload="auto"></audio>
    <audio ref="errorSound" :src="ErrorSound" preload="auto"></audio>
  </div>
</template>

<script setup lang="ts">
import { useAuthUserStore } from '~/stores/auth';
import { useNotification } from '~/composables/useNotification';
import { useVibrate } from '@vueuse/core';

import ErrorSound from '~/assets/audio/error.mp3';
import SuccessSound from '~/assets/audio/success.mp3';

const { vibrate, isSupported: isVibrationSupported } = useVibrate({
  pattern: [100],
});
const storeUser = useAuthUserStore();
const { user } = storeToRefs(storeUser);
const notification = useNotification();
const errorSound = ref<null | HTMLAudioElement>(null);
const successSound = ref<null | HTMLAudioElement>(null);
const lastSoundNotification = ref(new Date().getTime());

const preventSoundNotification = (old: number, seconds = 1) =>
  // if less than 5 seconds ago we stop any new sound notifications
  (Math.abs(old - new Date().getTime()) / 1000) % 60 < seconds;

watch(notification.state, (currentValue) => {
  if (currentValue.show === true && user.value.sound) {
    if (lastSoundNotification)
      if (!preventSoundNotification(lastSoundNotification.value)) {
        if (isVibrationSupported) vibrate(currentValue.error ? 300 : 100);
        currentValue.error
          ? errorSound.value.play()
          : successSound.value.play();
        lastSoundNotification.value = new Date().getTime();
      }
  }
  notification.close();
});
</script>
