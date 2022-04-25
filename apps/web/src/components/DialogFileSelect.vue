<template>
  <q-dialog ref="dialogRef" :maximized="true" @hide="onDialogHide">
    <q-card>
      <q-card-section>
        <div class="row">
          <q-space />
          <q-btn
            ref="closeBtn"
            v-close-popup
            icon="fas fa-times"
            flat
            round
            dense
          />
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
      <q-card-actions>
        <q-btn outline no-caps color="grey" @click="onDialogCancel()">
          {{ $t('close') }}
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { useServiceDropbox } from '~/composables/useDropbox';
import { useNotification } from '~/composables/useResponseText';
import FilesDropbox from './FilesDropbox.vue';

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
