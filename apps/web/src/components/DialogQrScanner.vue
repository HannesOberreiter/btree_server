<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { useScanner } from '../composables/useScanner';
import BtnCloseDialog from './BtnCloseDialog.vue';
import QrcodeScanner from './QrcodeScanner.vue';

defineEmits([...useDialogPluginComponent.emits]);

const { isStarting } = useScanner();

const { dialogRef, onDialogHide } = useDialogPluginComponent();
</script>

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
          <div class="text-h6">
            {{ $t('qrScanner') }}
          </div>
          <q-space />
          <BtnCloseDialog />
        </div>
      </q-card-section>
      <q-card-section class="text-center">
        <QrcodeScanner />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
