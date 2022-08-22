<template>
  <q-dialog
    ref="dialogRef"
    :maximized="$q.platform.is.mobile"
    data-cy="dialog-upload"
  >
    <q-card style="width: 700px">
      <q-card-section>
        <div class="row">
          <div class="text-h6">{{ $t('import') + ' ' + $t(table) }}</div>
          <q-space />
          <btn-close-dialog></btn-close-dialog>
        </div>
      </q-card-section>
      <upload-csv :table="table"></upload-csv>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef } = useDialogPluginComponent();

defineProps({
  table: {
    type: String,
    required: true,
  },
});
</script>
