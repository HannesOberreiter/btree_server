<template>
  <q-dialog ref="dialogRef" :maximized="$q.platform.is.mobile" @hide="onDialogHide">
    <q-card style="width: 700px">
      <global-loading v-if="!file"></global-loading>
      <div v-else-if="notFound" class="text-center text-h5">
        {{ $t('errorNoFile') }}
      </div>
      <q-card-section v-else>
        <div class="row">
          <div class="text-h6">
            {{ `${file.name} (${round(file.size / 1e6, 1)}MB)` }}
          </div>
          <q-space />
          <btn-close-dialog></btn-close-dialog>
        </div>
        <div class="row full-width text-center">
          <div v-if="isImage(file.name) && display" class="col-12">
            <q-img :src="display" style="width: 100%; height: 100%; border: none" />
          </div>
          <div v-else class="col-12"><q-icon name="fas fa-file"></q-icon></div>
        </div>
      </q-card-section>
      <q-card-actions align="center">
        <btn-base size="md" :label="$t('close')" color="primary" @click="onDialogOK" />
        <btn-base unelevated size="md" :disable="useDropbox.state.isLoading || notFound"
          :loading="useDropbox.state.isLoading" :label="$t('download')" color="secondary"
          @click="onDownload(service, file)">
          <tooltip-base v-if="file">
            {{ round(file.size / 1e6, 1) + ' MB' }}
          </tooltip-base>
        </btn-base>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { useServiceDropbox } from '../composables/useDropbox';
import { isImage } from '../helpers';
import round from 'lodash-es/round';
import BtnBase from './BtnBase.vue';
import TooltipBase from './TooltipBase.vue';
import GlobalLoading from './GlobalLoading.vue';
import BtnCloseDialog from './BtnCloseDialog.vue';

import { ref, watch, toRef } from 'vue';

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const useDropbox = useServiceDropbox();
const file = ref<any>(null);
const notFound = ref(false);
const display = ref<string | null>(null);
const service = ref('url');

defineEmits([...useDialogPluginComponent.emits]);
const props = defineProps({
  value: {
    type: String,
    required: true,
  },
});

const url = toRef(props, 'value');

watch(
  url,
  (cur) => {
    if (cur) getService(cur.trim());
  },
  { immediate: true },
);

function getService (value: string) {
  const values = value.split(/:(.*)/s);
  switch (values[0]) {
    case 'dropbox': {
      serviceDropbox(values[1]!);
      service.value = 'dropbox';
      break;
    }
    default: {
      service.value = 'url';
      serviceUrl(value);
    }
  }
}

function serviceDropbox (value: string) {
  useDropbox
    .getThumbnail(value)
    .then((response) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      file.value = response.result;
      display.value = isImage(file.value.name)
        ? URL.createObjectURL(file.value.fileBlob)
        : null;
    })
    .catch((e) => {
      if (e.status === 409) {
        useDropbox
          .getMeta(value)
          .then((response) => (file.value = response.result))
          .catch((e) => {
            file.value = true;
            notFound.value = true;
            console.error(e);
          });
      } else {
        file.value = true;
        notFound.value = true;
      }
      console.error(e);
    });
}

function serviceUrl (value: string) {
  file.value = {
    id: value,
    name: value,
    size: 0,
  };
  display.value = value;
}

function onDownload (service: string, file: any) {
  switch (service) {
    case 'dropbox': {
      useDropbox.download(file.id);
      break;
    }
    case 'url': {
      const link = document.createElement('a');
      link.href = file.id;
      link.setAttribute('download', 'download.jpg');
      document.body.appendChild(link);
      link.click();
      break;
    }
  }
}
</script>
