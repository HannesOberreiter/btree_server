<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="width: 700px">
      <global-loading v-if="!file"></global-loading>

      <q-card-section v-else>
        <div class="row">
          <div class="text-h6">
            {{ `${file.name} (${round(file.size / 1e6, 1)}MB)` }}
          </div>
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
        <div class="row full-width text-center">
          <div v-if="isImage(file.name)" class="col-12">
            <q-img
              :src="display"
              style="width: 100%; height: 100%; border: none"
            />
          </div>
          <div v-else class="col-12"><q-icon name="fas fa-file"></q-icon></div>
        </div>
      </q-card-section>
      <q-card-actions align="center">
        <q-btn
          unelevated
          size="md"
          :label="$t('close')"
          color="primary"
          @click="onDialogOK"
        />
        <q-btn
          unelevated
          size="md"
          :disable="useDropbox.state.isLoading"
          :loading="useDropbox.state.isLoading"
          :label="$t('download')"
          color="secondary"
          @click="onDownload"
        >
          <q-tooltip v-if="file">
            {{ round(file.size / 1e6, 1) + ' MB' }}
          </q-tooltip>
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { useServiceDropbox } from '~/composables/useDropbox';
import GlobalLoading from '~/components/GlobalLoading.vue';
import { isImage } from '~/helpers';
import round from 'lodash-es/round';

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const useDropbox = useServiceDropbox();
const file = ref(null);
const display = ref(null);

defineEmits([...useDialogPluginComponent.emits]);
const props = defineProps({
  service: {
    type: String,
    default: 'dropbox',
  },
  id: {
    type: String,
    required: true,
  },
});

watch(
  () => props.id,
  (cur) => {
    if (cur) {
      useDropbox
        .getThumbnail(cur)
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
              .getMeta(cur)
              .then((response) => (file.value = response.result))
              .catch((e) => console.error(e));
          }
          console.error(e);
        });
    }
  },
  { immediate: true }
);

function onDownload() {
  useDropbox.download(file.value.id);
}
</script>
