<template>
  <div></div>
</template>

<script setup lang="ts">
import { useAuthUserStore } from '~/stores/auth';
import { useNotification } from '~/composables/useNotification';
import { useSound } from '@vueuse/sound';
import { useVibrate } from '@vueuse/core';

import ErrorSound from '~/assets/audio/error.mp3';
import SuccessSound from '~/assets/audio/success.mp3';

const { vibrate, isSupported: isVibrationSupported } = useVibrate({
  pattern: [100],
});
const storeUser = useAuthUserStore();
const { user } = storeToRefs(storeUser);
const notification = useNotification();
const errorSound = useSound(ErrorSound);
const successSound = useSound(SuccessSound);

watch(notification.state, (currentValue) => {
  if (currentValue.show === true && user.value.sound) {
    if (isVibrationSupported) vibrate(currentValue.error ? 300 : 100);
    currentValue.error ? errorSound.play() : successSound.play();
  }
  notification.close();
});
</script>
