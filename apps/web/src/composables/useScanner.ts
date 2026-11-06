import { useDevicesList } from '@vueuse/core';
import {
  Html5Qrcode,
  Html5QrcodeScanType,
  Html5QrcodeSupportedFormats
} from 'html5-qrcode';
import { computed, ref } from 'vue';
import { useNotification } from '../composables/useNotification';

interface Html5QrCustom extends Html5Qrcode {
  localMediaStream: MediaStream;
}

const html5QrCode = ref<Html5QrCustom | null>(null);
const isScanning = ref(false);
const isStarting = ref(false);
const textError = ref('');
const textResult = ref('');

export function useScanner() {
  const { videoInputs: cameras } = useDevicesList();
  const notification = useNotification();

  const config = {
    fps: 10,
    qrbox: { width: 400, height: 400 },
    rememberLastUsedCamera: false,
    supportedScanTypes: [
      Html5QrcodeScanType.SCAN_TYPE_CAMERA,
      Html5QrcodeScanType.SCAN_TYPE_FILE
    ],
    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
  };

  const isAvailable = computed(() => cameras.value.length > 0);

  async function init(elementId = 'qr-code-full-region') {
    if (html5QrCode.value) {
      isScanning.value = false;
      isStarting.value = false;
      try {
        html5QrCode.value.localMediaStream?.getVideoTracks()[0]?.stop();
      } catch (err) {
        console.error(err);
      }
      await stopScanning();
    }

    html5QrCode.value = new Html5Qrcode(elementId, {
      verbose: false
    }) as unknown as Html5QrCustom;

    textError.value = '';
    textResult.value = '';
    const fileinput = document.getElementById('qr-input-file')!;
    fileinput.addEventListener('change', e => {
      const target = e.target as HTMLInputElement;

      if (target.files?.length === 0) {
        // No file selected, ignore
        return;
      }
      void stopScanning();
      html5QrCode.value!.clear();
      const imageFile = target.files![0]!;
      html5QrCode
        .value!.scanFile(imageFile, true)
        .then(decodedText => {
          console.log(decodedText);
          textResult.value = decodedText;
        })
        .catch(err => {
          console.error(`Error scanning file. Reason: ${err}`);
          textError.value = err;
        });
    });
  }

  function getPermission() {
    // This method will trigger user permissions
    try {
      Html5Qrcode.getCameras()
        .then(devices => {
          if (devices && devices.length) {
            console.log(devices);
          }
          notification.open('positive', '');
        })
        .catch(err => {
          console.error(err);
          textError.value = err;
        });
    } catch (err) {
      console.error(err);
    }
  }

  async function destroy() {
    if (html5QrCode.value) {
      try {
        if (html5QrCode.value.localMediaStream?.getVideoTracks) {
          html5QrCode.value.localMediaStream?.getVideoTracks()[0]?.stop();
        }
      } catch (err) {
        console.error(err);
      }
      await stopScanning();
      if (!isStarting.value) {
        html5QrCode.value = null;
      }
    }
  }

  async function startScanning() {
    if (html5QrCode.value) {
      isScanning.value = true;
      isStarting.value = true;
      try {
        await html5QrCode.value
          .start(
            { facingMode: 'environment' },
            config,
            qrCodeSuccessCallback,
            qrCodeErrorCallback
          )
          .catch(err => {
            console.error(err);
            isScanning.value = false;
            textError.value = err;
          });
        isStarting.value = false;
      } catch (err) {
        console.error(err);
        isStarting.value = false;
        await stopScanning();
        return false;
      }
    } else {
      return false;
    }
  }

  function qrCodeSuccessCallback(decodedText: string, decodedResult: any) {
    console.log(`Code matched = ${decodedText}`, decodedResult);
    if (!decodedText) {
      return;
    }
    if (decodedText === textResult.value) {
      return;
    }
    textResult.value = decodedText;
  }

  function qrCodeErrorCallback(error: string) {
    console.warn(`Code scan error = ${error}`);
    // textError.value = error;
  }

  async function stopScanning() {
    if (html5QrCode.value && !isStarting.value) {
      try {
        await html5QrCode.value
          .stop()
          .then(ignore => {
            console.log(ignore);
            isScanning.value = false;
            return true;
          })
          .catch(err => {
            console.error(err);
            textError.value = err;
            return false;
          });
      } catch (err) {
        console.error(err);
        return false;
      }
    } else {
      return true;
    }
  }

  return {
    html5QrCode,
    isAvailable,
    isScanning,
    isStarting,
    textResult,
    textError,
    init,
    destroy,
    getPermission,
    startScanning,
    stopScanning
  };
}
