<template>
  <q-item
    v-if="displayUpdatePrompt && isServiceWorkerAvailable"
    v-ripple
    clickable
    @click="isServiceWorkerAvailable ? messageSW() : ''"
  >
    <q-item-section avatar>
      <q-icon color="warning" name="fas fa-sync" />
    </q-item-section>
    <q-item-section> {{ $t('serviceWorker.refresh') }} </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { Workbox } from 'workbox-window';

const displayUpdatePrompt = ref(false);
const $q = useQuasar();
const { t } = useI18n();
const router = useRouter();

const isServiceWorkerAvailable = 'serviceWorker' in navigator;

let messageSW = () => {
  displayUpdatePrompt.value = false;
  console.log('no service worker');
};

/**
  https://developer.chrome.com/docs/workbox/handling-service-worker-updates/
*/
if (isServiceWorkerAvailable) {
  // workaround for SPA to check for updates on route changes
  watch(router.currentRoute, () => {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => {
        reg.update();
      });
    });
  });

  const wb = new Workbox('/sw.js');

  const showSkipWaitingPrompt = async (_event: any) => {
    // Assuming the user accepted the update, set up a listener
    // that will reload the page as soon as the previously waiting
    // service worker has taken control.
    wb.addEventListener('controlling', () => {
      // At this point, reloading will ensure that the current
      // tab is loaded under the control of the new service worker.
      // Depending on your web app, you may want to auto-save or
      // persist transient state before triggering the reload.
      window.location.reload();
    });

    // When `event.wasWaitingBeforeRegister` is true, a previously
    // updated service worker is still waiting.
    // You may want to customize the UI prompt accordingly.

    // This code assumes your app has a promptForUpdate() method,
    // which returns true if the user wants to update.
    // Implementing this is app-specific; some examples are:
    // https://open-ui.org/components/alert.research or
    // https://open-ui.org/components/toast.research
    $q.notify({
      color: 'negative',
      icon: 'fas fa-arrow-rotate',
      message: t('serviceWorker.newContent'),
      timeout: 0,
      multiLine: true,
      position: 'top',
      actions: [
        {
          label: t('refresh'),
          color: 'yellow',
          handler: () => {
            displayUpdatePrompt.value = false;
            wb.messageSkipWaiting();
          },
        },
        {
          label: t('cancel'),
          color: 'white',
          handler: () => {
            // Do nothing
          },
        },
      ],
    });
  };

  // Add an event listener to detect when the registered
  // service worker has installed but is waiting to activate.
  wb.addEventListener('waiting', (event) => {
    displayUpdatePrompt.value = true;
    showSkipWaitingPrompt(event);
  });
  messageSW = () => {
    displayUpdatePrompt.value = false;
    wb.messageSkipWaiting();
  };

  wb.register();
}
</script>
