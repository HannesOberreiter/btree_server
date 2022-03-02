<template>
  <q-banner
    dense
    inline-actions
    class="text-white"
    :class="message.error ? 'bg-red' : 'bg-green'"
  >
    <q-icon v-if="message.error" name="fas fa-xmark" />
    <q-icon v-else name="fas fa-check"></q-icon>
    {{ displayMessage }}
  </q-banner>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  useHandleError,
  useHandleSuccess,
} from '../composables/useResponseText';
const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
});

const displayMessage = ref('');

if (props.message.error) {
  displayMessage.value = useHandleError(props.message);
} else {
  displayMessage.value = useHandleSuccess(props.message);
}
</script>
