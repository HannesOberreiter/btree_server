<template>
  <div></div>
</template>

<script setup lang="ts">
import { useAuthUserStore } from '~/stores/auth';
import { useNotification } from '~/composables/useNotification';
import { useSound } from '@vueuse/sound';
import ErrorSound from '~/assets/audio/error.mp3';
import SuccessSound from '~/assets/audio/success.mp3';

const storeUser = useAuthUserStore();
const { user } = storeToRefs(storeUser);
const notification = useNotification();
const errorSound = useSound(ErrorSound);
const successSound = useSound(SuccessSound);

watch(notification.state, (currentValue) => {
  if (currentValue.show === true && user.value.sound) {
    if (currentValue.error) errorSound.play();
    else successSound.play();
  }
  notification.close();
});
</script>
