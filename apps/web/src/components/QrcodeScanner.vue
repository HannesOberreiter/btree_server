<template>
  <div class="row">
    <div class="col-12 text-center">{{ $t('result') }}: {{ resultText }}</div>
  </div>
  <div
    class="row"
    style="height: 100%; width: 100%; max-width: 450px; max-height: 450px"
  >
    <div id="qr-code-full-region" class="col-12"></div>
  </div>
  <div v-if="!deviceId" class="row">
    <div class="col-12">
      {{ $t('error.noCameraDetected') }}
    </div>
  </div>
  <div v-if="errorText" class="row">
    <div class="col-12">
      <small class="text-negative">{{ errorText }}</small>
    </div>
  </div>
  <div class="row">
    <div class="col-12 text-center q-pt-sm">
      {{ $t('file') }}:
      <input id="qr-input-file" type="file" accept="image/*" capture />
    </div>
  </div>
  <div class="row q-pt-lg">
    <div class="col-12 text-center">
      <BtnBaseGroup>
        <BtnBase color="primary" :disable="scanning" @click="startScanning">
          {{ $t('start') }}
        </BtnBase>
        <BtnBase color="negative" :disable="!scanning" @click="stopScanning">
          {{ $t('stop') }}
        </BtnBase>
      </BtnBaseGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Html5Qrcode,
  Html5QrcodeScanType,
  Html5QrcodeSupportedFormats,
} from 'html5-qrcode';
import { useNotification } from '~/composables/useNotification';
import { useScanningStore } from '~/stores/scanning';

const router = useRouter();
const notification = useNotification();
const storeScanning = useScanningStore();
const { hiveDropdownActive } = storeToRefs(storeScanning);

const scanning = ref(false);
const deviceId = ref('');
const errorText = ref('');
const resultText = ref('-----');
const html5QrCode = ref<Html5Qrcode | null>(null);

const config = {
  fps: 10,
  qrbox: { width: 400, height: 400 },
  rememberLastUsedCamera: false,
  supportedScanTypes: [
    Html5QrcodeScanType.SCAN_TYPE_CAMERA,
    Html5QrcodeScanType.SCAN_TYPE_FILE,
  ],
  formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
};

onUnmounted(() => {
  stopScanning();
  html5QrCode.value = null;
});
onMounted(async () => {
  stopScanning();
  //getPermission();
  html5QrCode.value = new Html5Qrcode('qr-code-full-region');

  const fileinput = document.getElementById('qr-input-file');
  fileinput.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;

    if (target.files.length == 0) {
      // No file selected, ignore
      return;
    }
    stopScanning();
    html5QrCode.value.clear();
    const imageFile = target.files[0];
    // Scan QR Code
    html5QrCode.value
      .scanFile(imageFile, true)
      .then((decodedText) => {
        // success, use decodedText
        console.log(decodedText);
        handleResult(decodedText);
      })
      .catch((err) => {
        // failure, handle it.
        console.error(`Error scanning file. Reason: ${err}`);
        errorText.value = err;
      });
  });
});

/*
function getPermission() {
  // This method will trigger user permissions
  try {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          console.log(devices);
          deviceId.value = devices[0].id;
        }
      })
      .catch((err) => {
        console.error(err);
        errorText.value = err;
      });
  } catch (err) {
    console.error(err);
  }
}
*/

function startScanning() {
  if (html5QrCode.value) {
    scanning.value = true;
    try {
      html5QrCode.value
        .start(
          { facingMode: 'environment' },
          config,
          qrCodeSuccessCallback,
          qrCodeErrorCallback
        )
        .catch((err) => {
          scanning.value = false;
          console.error(err);
          errorText.value = err;
        });
    } catch (err) {
      console.error(err);
      stopScanning();
    }
  }
}

function stopScanning() {
  if (html5QrCode.value) {
    try {
      html5QrCode.value
        .stop()
        .then((ignore) => {
          scanning.value = false;
          console.log(ignore);
        })
        .catch((err) => {
          scanning.value = false;
          console.error(err);
          errorText.value = err;
        });
    } catch (err) {
      console.error(err);
    }
  }
}

function handleResult(decodedText: string) {
  resultText.value = decodedText;
  if (hiveDropdownActive.value && storeScanning.extractUrl(decodedText)) {
    console.log('Scanned with active select box');
  } else {
    notification.open('positive', `QR: ${decodedText}`, true);
    if (decodedText.includes(window.location.origin)) {
      router.push(decodedText.replace(window.location.origin, ''));
    }
  }
  errorText.value = '';
}

function qrCodeSuccessCallback(decodedText: string, decodedResult: any) {
  // handle the scanned code as you like, for example:
  console.log(`Code matched = ${decodedText}`, decodedResult);
  if (decodedText === resultText.value) return;
  if (decodedText) {
    handleResult(decodedText);
  }
}

function qrCodeErrorCallback(error: string) {
  // handle scan failure, usually better to ignore and keep scanning.
  // for example:
  console.warn(`Code scan error = ${error}`);
}
</script>
