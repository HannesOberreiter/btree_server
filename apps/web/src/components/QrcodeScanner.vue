<template>
  <div class="row">
    <div class="col-12 text-center">{{ $t('result') }}: {{ textResult }}</div>
  </div>
  <div
    class="row"
    style="height: 100%; width: 100%; max-width: 450px; max-height: 450px"
  >
    <div id="qr-code-full-region" class="col-12"></div>
  </div>
  <div v-if="!isAvailable" class="row">
    <div class="col-12">
      {{ $t('error.noCameraDetected') }}
    </div>
  </div>
  <div v-if="textError" class="row">
    <div class="col-12">
      <small class="text-negative">{{ textError }}</small>
    </div>
  </div>
  <div class="row">
    <div class="col-12 text-center q-pt-sm">
      <input id="qr-input-file" type="file" accept="image/*" capture />
    </div>
  </div>
  <div class="row q-pt-lg">
    <div class="col-12 text-center">
      <BtnBaseGroup>
        <!--<BtnBase
          color="secondary"
          :disable="scanning || deviceId !== ''"
          @click="getPermission"
        >
          {{ $t('permission') }}
        </BtnBase>-->
        <BtnBase
          color="primary"
          :disable="isScanning && isAvailable"
          :loading="isStarting"
          @click="startScanning"
        >
          {{ $t('start') }}
        </BtnBase>
        <BtnBase
          color="negative"
          :loading="isStarting"
          :disable="!isScanning"
          @click="stopScanning"
        >
          {{ $t('stop') }}
        </BtnBase>
      </BtnBaseGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNotification } from '~/composables/useNotification';
import { useScanningStore } from '~/stores/scanning';
import { useScanner } from '~/composables/useScanner';

const router = useRouter();
const notification = useNotification();
const storeScanning = useScanningStore();
const { hiveDropdownActive } = storeToRefs(storeScanning);

const {
  init,
  startScanning,
  destroy,
  stopScanning,
  textError,
  textResult,
  isScanning,
  isAvailable,
  isStarting,
} = useScanner();

onUnmounted(() => {
  destroy();
});
onMounted(async () => {
  init();
});

watch(textResult, (cur) => {
  if (cur && cur !== '') {
    handleResult(cur);
  }
});

function handleResult(decodedText: string) {
  if (hiveDropdownActive.value && storeScanning.extractUrl(decodedText)) {
    console.log('Scanned with active select box');
  } else {
    notification.open('positive', `QR: ${decodedText}`, true);
    if (decodedText.includes(window.location.origin)) {
      router.push(decodedText.replace(window.location.origin, ''));
    }
  }
  textError.value = '';
}
</script>
