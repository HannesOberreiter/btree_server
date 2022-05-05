<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="width: 700px">
      <q-card-section>
        <div class="row">
          <div class="text-h6">{{ title }}</div>
          <q-space />
          <btn-base
            ref="closeBtn"
            v-close-popup
            icon="fas fa-times"
            flat
            round
            dense
            class="print-hide"
          />
        </div>
        <div class="row print-hide">
          {{ $t('currentPageLink') }}
        </div>
        <div class="row full-width justify-center">
          <img :src="qrcode" alt="b.tree - QR Code" />
        </div>
        <div class="row full-width justify-center">
          <div class="col-12">
            <q-input
              v-model="urlRef"
              :value="url"
              :label="$t('url')"
              :readonly="true"
            >
              <template #append>
                <btn-base
                  flat
                  icon="fas fa-copy"
                  @click="
                    copy(url).then(() =>
                      notification.open('info', 'copiedToClipboard')
                    )
                  "
                />
              </template>
            </q-input>
          </div>
        </div>
      </q-card-section>
      <q-card-section>
        <div class="row justify-center">
          <div class="text-h6">NFC</div>
        </div>
      </q-card-section>
      <q-card-actions align="center" class="print-hide">
        <btn-base-group>
          <btn-base :label="$t('read')" color="primary" @click="readNfcTag" />
          <btn-base
            :label="$t('write')"
            color="secondary"
            @click="writeNfcTag(url)"
          />
          <btn-base
            :label="$t('clear')"
            color="negative"
            @click="writeNfcTag('')"
          />
          <btn-base :label="$t('check')" color="grey" @click="checkNfcTag" />
          <btn-base :label="$t('cancel')" color="grey" @click="onDialogOK" />
        </btn-base-group>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { useQRCode } from '@vueuse/integrations/useQRCode';
import { useClipboard } from '@vueuse/core';
import { useNotification } from '~/composables/useNotification';

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const { copy } = useClipboard();
const notification = useNotification();
const router = useRouter();
const { t } = useI18n();

const props = defineProps({
  url: {
    type: String,
    required: true,
  },
});
const urlRef = ref(props.url);
const qrcode = useQRCode(props.url);
const title = router.currentRoute.value.meta.title
  ? t(router.currentRoute.value.meta.title as string) + ' - b.tree'
  : 'b.tree';

// Functional logic adapted from
// Project: https://github.com/maevsi/maevsi
// Commit: https://github.com/maevsi/maevsi/commit/6e132cda75127166f48859c6da29eb0f1ba6c099#diff-9bc2c5cb71c26f59ef0c2e9a0024abb2b895c1ce889fa890116b9fd2c1ed32a5
async function readNfcTag() {
  if ('NDEFReader' in window) {
    const ndef = new NDEFReader();
    try {
      await ndef.scan();
      ndef.onreading = (event: any) => {
        const decoder = new TextDecoder();
        for (const record of event.message.records) {
          console.log('Record type:  ' + record.recordType);
          console.log('MIME type:    ' + record.mediaType);
          console.log('=== data ===\n' + decoder.decode(record.data));
        }
      };
    } catch (error) {
      notification.open('negative', '');
      console.error(error);
    }
  } else {
    notification.open('negative', 'Web NFC is not supported.');
  }
}
async function checkNfcTag(): Promise<boolean> {
  if (!('NDEFReader' in window)) {
    notification.open('negative', 'Web NFC is not supported!');
    return Promise.resolve(false);
  }
  if (!navigator.permissions) {
    notification.open('negative', 'Navigator permissions are not supported!');
    return Promise.resolve(false);
  } else {
    const nfcPermissionStatus = await navigator.permissions.query({
      name: 'nfc' as PermissionName,
    });
    if (nfcPermissionStatus.state === 'granted') {
      return Promise.resolve(true);
    } else {
      alert(nfcPermissionStatus.state);
      return Promise.resolve(false);
    }
  }
}
async function writeNfcTag(e: any): Promise<void> {
  if (await checkNfcTag()) {
    try {
      await new NDEFReader().write(e);
      notification.open('positive', 'NDEF message written!');
    } catch (error) {
      notification.open('negative', error, true);
    }
  }
}
</script>
