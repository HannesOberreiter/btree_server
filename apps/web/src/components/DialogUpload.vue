<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import BtnCloseDialog from './BtnCloseDialog.vue';
import UploadCsv from './UploadCsv.vue';

defineProps({
  table: {
    type: String,
    required: true
  }
});
defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef } = useDialogPluginComponent();
</script>

<template>
  <q-dialog
    ref="dialogRef"
    :maximized="$q.platform.is.mobile"
    data-cy="dialog-upload"
  >
    <q-card style="width: 700px">
      <q-card-section>
        <div class="row">
          <div class="text-h6">
            {{ `${$t('import')} ${$t(table)}` }}
          </div>
          <q-space />
          <BtnCloseDialog />
        </div>
      </q-card-section>
      <UploadCsv :table="table" />
    </q-card>
  </q-dialog>
</template>
