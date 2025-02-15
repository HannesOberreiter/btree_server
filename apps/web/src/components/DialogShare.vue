<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { useQRCode } from '@vueuse/integrations/useQRCode';
import { useClipboard } from '@vueuse/core';
import { useNotification } from '../composables/useNotification';
import { useNFC } from '../composables/useNFC';
import { useDateFormat } from '../composables/useDate';
import BtnCloseDialog from './BtnCloseDialog.vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';
import BtnBaseGroup from './BtnBaseGroup.vue';
import BtnBase from './BtnBase.vue';

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();
const { copy } = useClipboard();
const notification = useNotification();
const router = useRouter();
const useDate = useDateFormat();
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
  if (nfc.state.writing || nfc.state.getContent) nfc.abort();
  onDialogHide();
}

function printQR() {
  setTimeout(() => {
    const printWindow = window.open('', '_blank', 'height=200,width=400')!;
    printWindow.document.write('<html>');
    printWindow.document.write(
      `
    <head>
      <title>
        btree_${title}
      </title>
      <style>
        img {
          display: block;
          margin-left: auto;
          margin-right: auto;
        }
      </style>
    </head>
    `,
    );
    const elem = document.getElementById('qr-code');
    if (!elem) {
      console.error('Element not found');
      return;
    }
    elem.style.textAlign = 'center';
    printWindow.document.write(
      `
    <body>
      <div style="text-align: center;">
        ${elem.outerHTML}
        <br/>
        ${useDate.displayFormat(useDate.getCurrent())} [b.tree]
      </div>
    </body>
    `,
    );
    printWindow.document.write('</html>');
    printWindow.document.close();
    setTimeout(function () {
      printWindow.print();
    }, 1000);

    //printWindow.addEventListener('afterprint', () => printWindow.close());
    printWindow.onafterprint = () => {
      setTimeout(function () {
        printWindow.close();
      }, 2000);
    };

    return;
  });
}
</script>

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
          <img id="qr-code" :src="qrcode" alt="b.tree - QR Code" />
          <btn-base icon="fas fa-print" @click="printQR"></btn-base>
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
                      notification.open('info', 'copiedToClipboard'),
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
            :disable="
              !nfc.isSupported() ||
              nfc.state.writing ||
              nfc.state.getContent ||
              nfc.state.clearing
            "
            @click="nfc.read"
          />
          <btn-base
            :label="$t('write')"
            color="secondary"
            :loading="nfc.state.writing"
            :disable="
              !nfc.isSupported() ||
              nfc.state.reading ||
              nfc.state.getContent ||
              nfc.state.clearing
            "
            @click="nfc.write(url, urlShort)"
          />
        </btn-base-group>
      </q-card-actions>
      <q-card-actions align="center" class="print-hide">
        <btn-base-group>
          <btn-base
            :label="nfc.state.getContent ? $t('ready') : $t('content')"
            color="secondary"
            :disable="
              !nfc.isSupported() ||
              nfc.state.writing ||
              nfc.state.clearing ||
              nfc.state.reading
            "
            @click="nfc.getContent()"
          />
          <btn-base
            :label="$t('clear')"
            color="negative"
            :loading="nfc.state.clearing"
            :disable="
              !nfc.isSupported() ||
              nfc.state.reading ||
              nfc.state.getContent ||
              nfc.state.writing
            "
            @click="nfc.write(null)"
          />
          <btn-base :label="$t('cancel')" color="grey" @click="nfc.abort()" />
        </btn-base-group>
        <div
          v-if="nfc.state.writingDone"
          class="col-12 text-center text-positive"
        >
          {{ $t('nfc.writingDone') }}
        </div>
        <div v-else-if="nfc.state.writing" class="col-12 text-center">
          {{ $t('nfc.writing') }}
          [{{ nfc.state.writingContent }}]
        </div>
        <div v-else-if="nfc.state.clearing" class="col-12 text-center">
          {{ $t('nfc.clearing') }}
        </div>
        <div v-else-if="nfc.state.reading" class="col-12 text-center">
          {{ $t('nfc.reading') }}
        </div>
        <div v-else-if="nfc.state.getContent" class="col-12 text-center">
          {{ $t('nfc.content') }}
        </div>
        <div v-if="nfc.state.content[0]" class="col-12 text-center">
          <div
            v-for="(item, index) in nfc.state.content[0]"
            :key="index"
            class="text-positive"
          >
            {{ item }}
          </div>
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
