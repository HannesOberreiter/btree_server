<template>
  <q-dialog data-cy="dialog-print-hive">
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
            <PrintHive
              v-for="(item, index) in items"
              :id="item.id + ''"
              :key="index"
              :year="parseInt(year)"
              @loaded="nextItem"
            ></PrintHive>
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
import { deepUnref } from '~/helpers/deep-unref';
import PrintHive from '~/pages/PrintHive.vue';
const props = defineProps({
  selected: {
    type: Object,
    required: true,
  },
  year: {
    type: String,
    required: true,
  },
});

const selected = toRef(props, 'selected');

const items = [] as any;
let loadItem = {};
let toLoadItems = [] as any;
const loading = ref(true);

watch(
  selected,
  () => {
    if (selected.value) {
      toLoadItems = deepUnref(selected.value);
      nextItem();
    }
  },
  { immediate: true }
);

function nextItem() {
  loadItem = toLoadItems.shift();
  if (loadItem) {
    items.push(loadItem);
  } else {
    loading.value = false;
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
