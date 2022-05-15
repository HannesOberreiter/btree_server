<!--  https://quasar.dev/vue-components/uploader -->
<template>
  <q-dialog
    ref="dialogRef"
    :maximized="$q.platform.is.mobile"
    @hide="onDialogHide"
  >
    <q-card v-if="service_active">
      <div class="row full-width">
        <div class="col-12">
          <q-uploader
            ref="uploader"
            flat
            :label="$t('upload')"
            capture="user"
            accept="image/*, audio/*"
            :max-file-size="2e7"
            :url="uploadUrl"
            :send-raw="true"
            :headers="(files) => buildHeader(files)"
            @failed="onFailed"
            @rejected="onRejected"
            @uploaded="onUpload"
            @added="queue = true"
            @removed="queue = false"
          />
        </div>
      </div>
      <q-card-actions align="center">
        <btn-base-group>
          <btn-base
            :disable="!queue"
            color="primary"
            @click="uploader.upload()"
          >
            {{ $t('upload') }}
          </btn-base>
          <btn-base
            :disable="queue"
            color="secondary"
            @click="uploader.pickFiles()"
          >
            {{ $t('select') }}
          </btn-base>
          <btn-base color="grey" @click="uploader.reset()">
            {{ $t('reset') }}
          </btn-base>
          <btn-base color="grey" @click="onDialogCancel()">
            {{ $t('close') }}
          </btn-base>
        </btn-base-group>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { useNotification } from '~/composables/useNotification';
import { useServiceDropbox } from '~/composables/useDropbox';

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const notification = useNotification();
const useDropbox = useServiceDropbox();
const uploader = ref(null);
const queue = ref(false);
const service_active = ref(false);

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

const uploadUrl = () => {
  return 'https://content.dropboxapi.com/2/files/upload';
};

const buildHeader = (files: File[]) => {
  return [
    {
      name: 'Authorization',
      value: `Bearer ${useDropbox.state.accessToken}`,
    },
    {
      name: 'Dropbox-API-Arg',
      value: JSON.stringify({
        path: useDropbox.state.path + '/' + files[0].name,
        autorename: true,
        mode: 'overwrite',
      }),
    },
    {
      name: 'Content-Type',
      value: 'application/octet-stream',
    },
  ];
};

function onUpload(info: any) {
  try {
    const response = JSON.parse(info.xhr.response);
    onDialogOK(props.service + ':' + response.id);
  } catch (e) {
    console.error(e);
  }
}

function onFailed(error: any) {
  console.log(error);
  notification.open('negative', 'Upload failed!');
}

function onRejected(rejectedEntries: any) {
  console.log(rejectedEntries);
  notification.open('negative', 'file(s) did not pass validation constraints');
}
</script>
