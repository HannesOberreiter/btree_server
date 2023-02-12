<template>
  <q-dialog ref="dialogRef" :maximized="true" @hide="onDialogHide">
    <q-card>
      <q-card-section>
        <div class="row">
          <q-space />
          <btn-close-dialog></btn-close-dialog>
        </div>
        <div class="row full-width">
          <div class="col-12">
            <files-dropbox
              v-if="service_active"
              :select="true"
              @selected="onDialogOK"
            ></files-dropbox>
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <btn-base outline color="grey" @click="onDialogCancel()">
          {{ $t('close') }}
        </btn-base>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { useServiceDropbox } from '~/composables/useDropbox';
import { useNotification } from '~/composables/useNotification';
import FilesDropbox from './FilesDropbox.vue';

import BtnCloseDialog from './BtnCloseDialog.vue';
import { defineProps, ref, watch } from 'vue';

defineEmits([...useDialogPluginComponent.emits]);
const notification = useNotification();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const service_active = ref(false);
const useDropbox = useServiceDropbox();
const props = defineProps({
  service: {
    type: String,
    default: 'dropbox',
  },
});

watch(
  () => props.service,
  (cur) => {
    if (cur === 'dropbox')
      useDropbox.getAccessToken().then((response) => {
        if (!response) {
          onDialogHide();
          notification.open('negative', 'noFileService');
        }
        service_active.value = response;
      });
  },
  { immediate: true }
);
</script>
