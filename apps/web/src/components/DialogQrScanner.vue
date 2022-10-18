<template>
  <q-dialog
    ref="dialogRef"
    data-cy="dialog-share"
    :persistent="isStarting"
    @hide="onDialogHide"
  >
    <q-card>
      <q-card-section>
        <div class="row">
          <div class="text-h6">{{ $t('qrScanner') }}</div>
          <q-space />
          <btn-close-dialog></btn-close-dialog>
        </div>
      </q-card-section>
      <q-card-section class="text-center">
        <qrcode-scanner></qrcode-scanner>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { useScanner } from '~/composables/useScanner';

const { isStarting } = useScanner();

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();
</script>
