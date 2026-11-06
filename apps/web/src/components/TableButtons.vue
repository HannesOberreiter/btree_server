<script setup lang="ts">
import { useVModels } from '@vueuse/core';
import { stringify } from 'csv-stringify/browser/esm/sync';
import { exportFile, useQuasar } from 'quasar';
import { computed, toRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useApiFetch } from '../composables/useApi';
import { useDateFormat } from '../composables/useDate';
import { useNotification } from '../composables/useNotification';
import { clearCache } from '../composables/useQuery';
import { useAuthUserStore } from '../stores/auth';
import { useTableFilterStore } from '../stores/tableFilter';
import BtnBase from './BtnBase.vue';
import BtnBaseGroup from './BtnBaseGroup.vue';
import DialogFilter from './DialogFilter.vue';
import DialogForm from './DialogForm.vue';
import DialogPrintHive from './DialogPrintHive.vue';
import DialogPrintQr from './DialogPrintQr.vue';
import DialogUpload from './DialogUpload.vue';
import TableButtonScale from './TableButtonScale.vue';
import TooltipBase from './TooltipBase.vue';

const props = defineProps({
  selected: {
    type: Array,
    required: true
  },
  deleted: {
    required: true
  },
  modus: {
    required: true
  },
  table: {
    type: String,
    required: true
  },
  tableOption: {
    type: String,
    default: ''
  },
  labelModusTrue: {
    default: 'active'
  },
  labelModusFalse: {
    default: 'inactive'
  }
});
const emit = defineEmits(['update:deleted', 'update:modus', 'change']);
const storeFilter = useTableFilterStore();
const useDate = useDateFormat();
const api = useApiFetch();
const router = useRouter();
const { t } = useI18n();
const $q = useQuasar();
const notification = useNotification();
const storeUser = useAuthUserStore();

const { deleted, modus } = useVModels(props, emit);
const selected = toRef(props, 'selected');
const filter = computed(() => storeFilter.table(props.table) !== '');

function dialogForm(
  title: string,
  ids: any[] | null,
  form = props.table,
  selected = null as any
) {
  $q.dialog({
    component: DialogForm,
    componentProps: {
      title,
      form,
      maximized: !['todo', 'option'].includes(form),
      selected,
      ids,
      copy: title === 'copy',
      option: props.tableOption
    }
  }).onOk(() => {
    onEmit();
  });
}

function openFilter() {
  $q.dialog({
    component: DialogFilter,
    componentProps: {
      form: props.table
    }
  });
}

function onNew() {
  dialogForm('add', null);
}

function onEdit() {
  const ids = selected.value.map((o: any) => o.id);
  dialogForm('edit', ids);
}

function onCopy() {
  const ids = [selected.value.map((o: any) => o.id)[0]];
  dialogForm('copy', ids);
}

function onMove() {
  const ids =
    props.table === 'hive' ? selected.value.map((o: any) => o.id) : null;
  dialogForm('movement', null, 'movedate', ids);
}

function onAddQueen() {
  const ids = selected.value.map((o: any) => o.id);
  dialogForm('queen', null, 'queen', ids);
}

function onVirginToHive() {
  const ids = selected.value.map((o: any) => o.id);
  dialogForm('virginToHive', ids, 'queen_hive');
}

function onRestore() {
  const ids = selected.value.map((o: any) => o.id);
  api
    .patch(
      `/v1/${
        props.table === 'virgin' ? 'queen' : props.table
      }/batchDelete?restore=true`,
      { ids }
    )
    .then(
      (_response: any) => {
        onEmit();
        notification.open('positive', '');
      },
      error => {
        notification.open('negative', error);
      }
    );
}

function onDelete() {
  let message = t('deleteConfirmRow', { count: selected.value.length });
  if (props.table === 'hive') {
    message += ` ${t('deleteConfirmHive')}`;
  }
  if (props.table === 'apiary') {
    message += ` ${t('deleteApiary')}`;
  }

  if (['movedate'].includes(props.table) || deleted.value) {
    message += ` <b>${t('warningNoUndo')}</b>`;
  }

  $q.dialog({
    title: t('delete'),
    message,
    ok: {
      label: t('yes'),
      class: 'btn-confirm'
    },
    cancel: true,
    persistent: true,
    html: true
  }).onOk(() => {
    const ids = selected.value.map((o: any) => o.id);

    let url = '';

    switch (props.table) {
      case 'virgin':
        url = '/v1/queen/batchDelete';
        break;
      case 'option':
        url = `/v1/${props.table}/${props.tableOption}/batchDelete`;
        break;
      default:
        url = `/v1/${props.table}/batchDelete`;
    }

    api.patch(url, { ids }).then(
      (_response: any) => {
        emit('change');
        notification.open('positive', '');
      },
      error => {
        notification.open('negative', error);
      }
    );
  });
}

function onEmit() {
  clearCache(props.table);
  emit('change');
}

// https://stackoverflow.com/a/53739792/5316675 CC BY-SA 4.0 Muthukrishnan
function flattenObject(ob: any) {
  const toReturn = {} as any;

  for (const i in ob) {
    if (!Object.hasOwn(ob, i)) {
      continue;
    }

    if (typeof ob[i] == 'object' && ob[i] !== null) {
      const flatObject = flattenObject(ob[i]);
      for (const x in flatObject) {
        if (!Object.hasOwn(flatObject, x)) {
          continue;
        }

        toReturn[`${i}.${x}`] = flatObject[x];
      }
    } else {
      toReturn[i] = ob[i];
    }
  }
  return toReturn;
}

function onExport() {
  $q.dialog({
    title: t('export'),
    message: t('exportCsvSeparator'),
    options: {
      type: 'radio',
      model: ';',
      inline: true,
      items: [
        { label: t('separatorSemicolon'), value: ';', default: true },
        { label: t('separatorComma'), value: ',' }
      ]
    },
    ok: {
      label: t('yes'),
      class: 'btn-confirm'
    },
    cancel: true,
    persistent: true
  }).onOk((val: string) => {
    $q.loading.show({ delay: 200 });
    const values: any = [];
    selected.value.forEach((o: any) => {
      values.push(flattenObject(o));
    });
    const csv = stringify(values, { header: true, delimiter: val });
    const status = exportFile(
      `${props.table}${props.tableOption}-export-${useDate.getCurrent()}.csv`,
      csv,
      'text/csv'
    );
    $q.loading.hide();
    if (status !== true) {
      $q.notify({
        message: t('failedDownload'),
        color: 'negative',
        icon: 'warning'
      });
    }
  });
}

function onImport() {
  $q.dialog({
    component: DialogUpload,
    componentProps: {
      table: props.table
    }
  });
}

function onPrintHive() {
  $q.dialog({
    title: t('year'),
    prompt: {
      model: `${new Date().getFullYear()}`,
      type: 'number'
    },
    ok: {
      label: t('print'),
      class: 'btn-confirm'
    },
    cancel: true,
    persistent: true
  }).onOk((val: number) => {
    $q.dialog({
      component: DialogPrintHive,
      componentProps: {
        selected: props.selected,
        year: val,
        apiary: props.table === 'apiary'
      }
    });
  });
}

function onPrintQR() {
  $q.dialog({
    component: DialogPrintQr,
    componentProps: {
      selected: props.selected
    }
  });
}

function onPrint() {
  setTimeout(() => {
    const printWindow = window.open('', '_blank', 'height=200,width=400')!;
    printWindow.document.write('<html>');
    printWindow.document.write(
      `
    <head>
      <title>
        btree_${
          router.currentRoute.value.meta.title
            ? t(router.currentRoute.value.meta.title as string)
            : ''
        }_${useDate.isoFormat(useDate.getCurrent())}
      </title>
      <link rel="stylesheet" type="text/css" href="/print-table.css?timestamp=${Date.now()}" />
    </head>
    `
    );
    const table = document.getElementsByClassName('q-table')[0];
    if (!table) {
      return;
    }
    printWindow.document.write(
      `
    <body>
      ${table.outerHTML}
      <br/>
      <b>${storeUser.getCompany.name}</b> -
      ${useDate.displayFormat(useDate.getCurrent())} [b.tree]
    </body>
    `
    );
    printWindow.document.write('</html>');
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 1000);

    // printWindow.addEventListener('afterprint', () => printWindow.close());
    printWindow.onafterprint = () => {
      setTimeout(() => {
        printWindow.close();
      }, 2000);
    };
  });
}
</script>

<template>
  <BtnBaseGroup size="sm" :spread="false">
    <BtnBase
      v-if="
        ![
          'statistic_harvest_table',
          'statistic_feed_table',
          'statistic_treatment_table',
          'statistic_rating_table',
          'statistic_queen_table',
          'chargeStock'
        ].includes(table)
      "
      color="primary"
      icon="fas fa-plus"
      data-cy="btn-table-new"
      @click="onNew"
    >
      <TooltipBase>{{ $t('add') }}</TooltipBase>
    </BtnBase>
    <BtnBase
      v-if="
        ![
          'statistic_harvest_table',
          'statistic_feed_table',
          'statistic_treatment_table',
          'statistic_rating_table',
          'statistic_queen_table',
          'chargeStock'
        ].includes(table)
      "
      color="secondary"
      :disable="selected.length > 0 ? false : true"
      icon="fas fa-pen"
      data-cy="btn-table-edit"
      @click="onEdit"
    >
      <TooltipBase>{{ $t('edit') }}</TooltipBase>
    </BtnBase>

    <BtnBase
      v-if="['hive', 'queen', 'virgin', 'charge'].includes(table)"
      color="info"
      :disable="selected.length === 1 ? false : true"
      icon="fas fa-copy"
      data-cy="btn-table-copy"
      @click="onCopy"
    >
      <TooltipBase>{{ $t('copy') }}</TooltipBase>
    </BtnBase>

    <BtnBase
      v-if="['virgin'].includes(table)"
      color="info"
      :disable="selected.length === 1 ? false : true"
      icon="fas fa-house"
      data-cy="btn-table-virginToHive"
      @click="onVirginToHive"
    >
      <TooltipBase>{{ $t('virginToHive') }}</TooltipBase>
    </BtnBase>

    <BtnBase
      v-if="
        [
          'hive',
          'apiary',
          'todo',
          'feed',
          'treatment',
          'harvest',
          'checkup',
          'queen',
          'virgin'
        ].includes(table)
      "
      :color="
        modus === true ? 'warning' : modus === false ? 'negative' : 'info'
      "
      :icon-right="
        modus === true
          ? 'fas fa-eye'
          : modus === false
            ? 'fas fa-eye-slash'
            : 'fas fa-eye-low-vision'
      "
      :label="
        modus === true
          ? $t(labelModusTrue)
          : modus === false
            ? $t(labelModusFalse)
            : $t('both')
      "
      data-cy="btn-table-modus"
      @click="modus = modus === true ? false : modus === false ? null : true"
    />

    <BtnBase
      v-if="
        [
          'hive',
          'queen',
          'movedate',
          'todo',
          'feed',
          'harvest',
          'treatment',
          'checkup',
          'charge',
          'scale_data',
          'statistic_harvest_table',
          'statistic_feed_table',
          'statistic_treatment_table',
          'statistic_rating_table',
          'statistic_queen_table'
        ].includes(table)
      "
      :color="filter ? 'negative' : 'warning'"
      :icon-right="filter ? 'fas fa-filter' : 'fas fa-filter-circle-xmark'"
      @click="openFilter"
    >
      <TooltipBase>{{ $t('filter') }}</TooltipBase>
    </BtnBase>

    <TableButtonScale v-if="table === 'scale_data'" @change="emit('change')" />

    <q-btn-dropdown
      no-caps
      color="info"
      label="..."
      class="print-hide"
      data-cy="btn-table-dropdown"
    >
      <q-list>
        <q-item
          v-if="table === 'hive'"
          v-close-popup
          clickable
          @click="onAddQueen"
        >
          <q-item-section>
            <q-item-label>{{ $t('queenAdd') }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          v-if="['hive', 'apiary'].includes(table)"
          v-close-popup
          clickable
          @click="onMove"
        >
          <q-item-section>
            <q-item-label>{{ $t('movement') }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator />

        <q-item
          v-close-popup
          clickable
          :disable="selected.length > 0 ? false : true"
          @click="onExport"
        >
          <q-item-section avatar>
            <q-avatar>
              {{ selected.length }}
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ $t('exportCSV') }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          v-if="
            storeUser.isAdmin &&
            ['feed', 'harvest', 'treatment', 'checkup'].includes(table)
          "
          v-close-popup
          clickable
          @click="onImport"
        >
          <q-item-section avatar>
            <q-avatar>
              <q-icon name="fas fa-file-csv" />
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ $t('importCSV') }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item v-close-popup clickable @click="onPrint">
          <q-item-section avatar>
            <q-avatar>
              <q-icon name="fas fa-print" />
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ $t('printTable') }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          v-if="table === 'hive' || table === 'apiary'"
          v-close-popup
          clickable
          :disable="
            selected.length === 0 ||
            selected.length > 50 ||
            (table === 'apiary' && selected.length > 1)
          "
          @click="onPrintHive"
        >
          <q-item-section avatar>
            <q-avatar>
              {{ selected.length }}
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>
              {{ `${$t('print')} ${$t('hiveCard')}` }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          v-if="table === 'hive'"
          v-close-popup
          clickable
          :disable="selected.length === 0 || selected.length > 50"
          @click="onPrintQR"
        >
          <q-item-section avatar>
            <q-avatar>
              {{ selected.length }}
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ `${$t('print')} ${$t('qr')}` }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator />

        <q-item
          v-if="
            ![
              'statistic_harvest_table',
              'statistic_feed_table',
              'statistic_treatment_table',
              'statistic_rating_table',
              'statistic_queen_table',
              'chargeStock'
            ].includes(table)
          "
          v-close-popup
          clickable
          :disable="selected.length > 0 ? false : true"
          data-cy="btn-table-delete"
          @click="onDelete"
        >
          <q-item-section avatar>
            <q-avatar>
              {{ selected.length }}
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ $t('delete') }}</q-item-label>
          </q-item-section>
        </q-item>
        <!-- Restoring of deleted rows is not possible for every table -->
        <div
          v-if="
            [
              'hive',
              'queen',
              'virgin',
              'apiary',
              'feed',
              'harvest',
              'treatment',
              'checkup',
              'charge'
            ].includes(table)
          "
        >
          <q-item
            v-close-popup
            clickable
            :disable="selected.length > 0 && deleted ? false : true"
            @click="onRestore"
          >
            <q-item-section avatar>
              <q-avatar>
                {{ deleted ? selected.length : 0 }}
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('restore') }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-close-popup clickable @click="deleted = !deleted">
            <q-item-section avatar>
              <q-avatar>
                <q-icon :name="deleted ? 'fas fa-eye' : 'fas fa-eye-slash'" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>
                {{ $t('deleted') }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </div>
      </q-list>
    </q-btn-dropdown>
  </BtnBaseGroup>
</template>
