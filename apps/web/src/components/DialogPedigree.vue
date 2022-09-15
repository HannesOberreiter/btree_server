<template>
  <q-dialog ref="dialogRef" data-cy="dialog-pedigree">
    <q-card style="width: 700px">
      <q-card-section>
        <div class="row">
          <div class="text-h6">{{ $t('pedigree') }}</div>
          <q-space />
          <btn-close-dialog></btn-close-dialog>
        </div>
        <list-pedigree :id="id"></list-pedigree>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';

const { dialogRef } = useDialogPluginComponent();

defineProps({
  id: {
    type: Number,
    required: true,
  },
});
</script>
