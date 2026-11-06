<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { ref, watch } from 'vue';
import { useServiceDropbox } from '../composables/useDropbox';
import { useNotification } from '../composables/useNotification';
import BtnBase from './BtnBase.vue';
import BtnCloseDialog from './BtnCloseDialog.vue';
import FilesDropbox from './FilesDropbox.vue';

const props = defineProps({
  service: {
    type: String,
    default: 'dropbox'
  }
});
defineEmits([...useDialogPluginComponent.emits]);
const notification = useNotification();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const service_active = ref(false);
const useDropbox = useServiceDropbox();
watch(
  () => props.service,
  cur => {
    if (cur === 'dropbox') {
      useDropbox.getAccount().then(response => {
        if (!response) {
          onDialogHide();
          notification.open('negative', 'noFileService');
        }
        service_active.value = response;
      });
    }
  },
  { immediate: true }
);
</script>

<template>
  <q-dialog ref="dialogRef" :maximized="true" @hide="onDialogHide">
    <q-card>
      <q-card-section>
        <div class="row">
          <q-space />
          <BtnCloseDialog />
        </div>
        <div class="row full-width">
          <div class="col-12">
            <FilesDropbox
              v-if="service_active"
              :select="true"
              @selected="onDialogOK"
            />
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <BtnBase outline color="grey" @click="onDialogCancel()">
          {{ $t('close') }}
        </BtnBase>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
