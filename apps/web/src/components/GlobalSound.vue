<template>
  <div></div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-var-requires */
import { useSound } from '@vueuse/sound';
import { useNotification } from '../composables/useResponseText';
import { watch } from 'vue';
import { useAuthUserStore } from '../stores/auth';
import { storeToRefs } from 'pinia';

const { user } = storeToRefs(useAuthUserStore());
const notification = useNotification();
const errorSound = useSound(require('assets/audio/error.mp3'));
const successSound = useSound(require('assets/audio/success.mp3'));

watch(notification.state, (currentValue) => {
  if (currentValue.show === true && user.value.sound) {
    if (currentValue.error) errorSound.play();
    else successSound.play();
  }
  notification.close();
});
</script>
