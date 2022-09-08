<template>
  <q-dialog ref="dialogRef" data-cy="dialog-share" @hide="onDialogHide">
    <q-card>
      <q-card-section>
        <div class="row">
          <div class="text-h6">{{ $t('qrScanner') }}</div>
          <q-space />
          <btn-close-dialog></btn-close-dialog>
        </div>
      </q-card-section>
      <q-card-section class="text-center">
        <div v-if="hasCamera">
          {{ $t('result') }}: {{ result }}
          <video
            ref="videoRef"
            style="max-width: 80vw; max-height: 90vh; width: 500px"
            poster="/icons/icon-512x512.png"
          >
            {{ $t('error.noVideoTag') }}
          </video>
          <small class="text-negative">{{ errorMessage }}</small>
        </div>
        <div v-if="!hasCamera">
          {{ $t('error.noCameraDetected') }}
        </div>
      </q-card-section>
      <q-card-actions align="center" class="print-hide">
        <btn-base-group>
          <btn-base
            :label="isActive ? $t('active') : $t('read')"
            color="primary"
            :disable="!hasCamera || isActive"
            @click="onStart"
          />
          <btn-base
            :label="$t('stop')"
            color="negative"
            :disable="!hasCamera || !isActive"
            @click="onStop"
          />
        </btn-base-group>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import QrScanner from 'qr-scanner';
import { useNotification } from '~/composables/useNotification';

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();

const notification = useNotification();
const videoRef = ref(null);
let scanner = null as any;
const hasCamera = ref(false);
const isActive = ref(false);
const result = ref('--');
const errorMessage = ref('');

onMounted(() =>
  QrScanner.hasCamera().then((value) => (hasCamera.value = value))
);

watch(
  [videoRef, hasCamera],
  () => {
    if (videoRef.value && hasCamera.value) {
      scanner = new QrScanner(videoRef.value, onResult, {
        onDecodeError: onError,
        returnDetailedScanResult: true,
        preferredCamera: 'environment',
        maxScansPerSecond: 1,
        highlightScanRegion: true,
      });
      scanner
        .start()
        .then(() => {
          console.log('QR scanner starting');
          isActive.value = true;
        })
        .catch(console.error);
    }
  },
  { immediate: true }
);

function onResult(val: any) {
  notification.open('positive', `QR: ${val.data}`, true);
  result.value = val.data;
}
function onError(error: any) {
  errorMessage.value = error;
}

function onStop() {
  if (scanner) scanner.stop();
  isActive.value = false;
}

function onStart() {
  if (scanner) scanner.start();
  isActive.value = true;
}

onUnmounted(() => {
  if (scanner) {
    scanner.stop();
    scanner.destroy();
    scanner = null;
  }
  isActive.value = false;
});
</script>
