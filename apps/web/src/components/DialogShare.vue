<template>
  <q-dialog
    ref="dialogRef"
    :maximized="$q.platform.is.mobile"
    data-cy="dialog-share"
    @hide="onHide"
  >
    <q-card style="width: 700px">
      <q-card-section>
        <div class="row">
          <div class="text-h6">{{ title }}</div>
          <q-space />
          <btn-close-dialog></btn-close-dialog>
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
              data-cy="input-url"
              :value="url"
              :label="$t('url')"
              :readonly="true"
            >
              <template #append>
                <btn-base
                  flat
                  icon="fas fa-copy"
                  data-cy="btn-copy"
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
        <div class="row print-hide">
          <div class="col-12 text-center text-h6">NFC</div>
          <div v-if="!nfc.isSupported()" class="col-12 text-center">
            {{ $t('error.nfcNotSupported') }}
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="center" class="print-hide">
        <btn-base-group>
          <btn-base
            :label="nfc.state.reading ? $t('active') : $t('read')"
            color="primary"
            :disable="!nfc.isSupported() || nfc.state.reading"
            @click="nfc.read"
          />
          <btn-base
            :label="$t('write')"
            color="secondary"
            :disable="!nfc.isSupported() || nfc.state.writing"
            @click="nfc.write(url, urlShort)"
          />
          <btn-base
            :label="$t('clear')"
            color="negative"
            :disable="!nfc.isSupported() || nfc.state.writing"
            @click="nfc.write(null)"
          />
          <btn-base
            :label="$t('cancel')"
            color="grey"
            :disable="!nfc.state.writing && !nfc.state.reading"
            @click="nfc.abort()"
          />
        </btn-base-group>
        <div v-if="nfc.state.writing" class="col-12 text-center">
          {{ $t('nfc.writing') }}
        </div>
        <div v-if="nfc.state.reading" class="col-12 text-center">
          {{ $t('nfc.reading') }}
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { useQRCode } from '@vueuse/integrations/useQRCode';
import { useClipboard } from '@vueuse/core';
import { useNotification } from '~/composables/useNotification';
import { useNFC } from '~/composables/useNFC';

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();
const { copy } = useClipboard();
const notification = useNotification();
const router = useRouter();
const nfc = useNFC();
const { t } = useI18n();

const props = defineProps({
  url: {
    type: String,
    required: true,
  },
});
const urlRef = ref(props.url);
const qrcode = useQRCode(props.url);
const urlShort = router.currentRoute.value.path;
const title = router.currentRoute.value.meta.title
  ? t(router.currentRoute.value.meta.title as string) + ' - b.tree'
  : 'b.tree';

function onHide() {
  if (nfc.state.writing) nfc.abort();
  onDialogHide();
}
</script>
