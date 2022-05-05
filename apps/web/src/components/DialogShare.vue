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
          <btn-base :label="$t('read')" color="primary" @click="nfc.read" />
          <btn-base
            :label="$t('write')"
            color="secondary"
            @click="nfc.write(url)"
          />
          <btn-base
            :label="$t('clear')"
            color="negative"
            @click="nfc.write('')"
          />
          <btn-base :label="$t('check')" color="grey" @click="nfc.check" />
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
import { useNFC } from '~/composables/useNFC';

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
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
const title = router.currentRoute.value.meta.title
  ? t(router.currentRoute.value.meta.title as string) + ' - b.tree'
  : 'b.tree';
</script>
