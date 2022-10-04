<template>
  <q-dialog data-cy="dialog-print-qr">
    <q-card>
      <q-card-section>
        <div class="row">
          <span v-if="loading">{{ $t('loading') }}</span>
          <q-space />
          <btn-close-dialog></btn-close-dialog>
        </div>
      </q-card-section>
      <q-card-section>
        <q-scroll-area style="height: 50vh; width: 500px; max-width: 80vh">
          <div id="printContainer">
            <div class="row q-col-gutter-xs">
              <div
                v-for="(item, index) in items"
                :key="index"
                class="col-4 text-center"
              >
                <img
                  :id="`qr-code-${item.id}`"
                  :src="item.image"
                  :alt="`b.tree - QR Code - ${item.name}`"
                />

                <figcaption>{{ item.name }}</figcaption>
                <tooltip-base>{{ item.url }}</tooltip-base>
              </div>
            </div>
          </div>
        </q-scroll-area>
      </q-card-section>
      <q-card-actions align="right">
        <btn-base
          flat
          :loading="loading"
          :label="$t('print')"
          color="primary"
          icon="fas fa-print"
          @click="onPrint"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import QRCode from 'qrcode';
import { deepUnref } from '~/helpers/deep-unref';

const props = defineProps({
  selected: {
    type: Object,
    required: true,
  },
});

const selected = toRef(props, 'selected');
const loading = ref(true);
const items = ref(null);

watch(
  selected,
  () => {
    if (selected.value) {
      items.value = deepUnref(selected.value);
      items.value.map(async (o: any) => {
        o.url = createUrl(o.id);
        o.image = await generateQR(o.url);
      });
      loading.value = false;
    }
  },
  { immediate: true }
);

function createUrl(id: string) {
  const baseUrl = window.location.origin;
  return baseUrl + '/detail/hive/' + id;
}

async function generateQR(url: string) {
  try {
    return await QRCode.toDataURL(url);
  } catch (err) {
    console.error(err);
  }
}

function onPrint() {
  setTimeout(() => {
    const printWindow = window.open('', '_blank', 'height=200,width=400');
    printWindow.document.write('<html>');
    printWindow.document.write(
      `
    <head>
      <title>
        btree
      </title>
      <link rel="stylesheet" type="text/css" href="/print-table.css?timestamp=${Date.now()}" />
    </head>
    `
    );
    const element = document.getElementById('printContainer');
    printWindow.document.write(
      `
    <body>
      ${element.outerHTML}
    </body>
    `
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
