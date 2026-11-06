import type { PWAInstallElement } from '@khmyznikov/pwa-install';
import { ref } from 'vue';
import { useNotification } from './useNotification';

/**
 * Composables for handling PWA installation.
 * @see https://github.com/khmyznikov/pwa-install
 */
export function useInstallPWA() {
  const notification = useNotification();
  const isAvailable = ref(false);

  let element: PWAInstallElement | null;
  if (typeof window !== 'undefined') {
    element = document.querySelector('pwa-install');
    if (element) {
      element = element as PWAInstallElement;
      isAvailable.value = element.isInstallAvailable;
      element.addEventListener('pwa-install-fail-event', (event: any) => {
        console.error('PWA Install failed:', event.detail.message);
      });
      element.addEventListener('pwa-install-success-event', (event: any) => {
        console.log(event.detail.message);
      });
    }
  }

  function showDialog() {
    if (!element) {
      console.warn(
        'PWA Install element is not initialized. Please ensure it is included in your template.'
      );
      return;
    }
    if (!element.isInstallAvailable) {
      notification.open('negative', 'pwa.notAvailable', false);
      return;
    }
    element.showDialog(true);
  }

  return { showDialog, isAvailable };
}
