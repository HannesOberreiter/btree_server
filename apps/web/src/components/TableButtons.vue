<template>
  <q-btn-group unelevated size="sm">
    <q-btn color="primary" no-caps :label="$t('new')" @click="onNew" />
    <q-btn
      color="secondary"
      no-caps
      :disable="selected.length > 0 ? false : true"
      :label="$t('edit')"
      @click="onEdit"
    />

    <q-btn
      color="warning"
      no-caps
      :icon-right="modus ? 'fas fa-eye' : 'fas fa-eye-slash'"
      :label="$t('inactive')"
      @click="modus = !modus"
    />

    <q-btn
      v-if="['hive'].includes(table)"
      color="warning"
      no-caps
      :label="$t('filter')"
      :icon-right="filter ? 'fas fa-filter' : 'fas fa-filter-circle-xmark'"
      @click="openFilter"
    />

    <q-btn-dropdown no-caps color="info" label="...">
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

        <q-item v-close-popup clickable @click="onMove">
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

        <q-separator />

        <q-item
          v-close-popup
          clickable
          :disable="selected.length > 0 ? false : true"
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
              <q-icon
                :name="deleted ? 'fas fa-eye' : 'fas fa-eye-slash'"
              ></q-icon>
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>
              {{ $t('deleted') }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-btn-dropdown>
  </q-btn-group>
</template>

<script setup lang="ts">
import { useVModels } from '@vueuse/core';
import { stringify } from 'csv-stringify/browser/esm/sync';
import { exportFile } from 'quasar';
import { api } from '~/boot/axios';
import { useDateFormat } from '~/composables/useDate';
import { clearCache } from '~/composables/useQuery';
import { useNotification } from '~/composables/useResponseText';
import { useTableFilterStore } from '~/stores/tableFilter';
import DialogFilter from './DialogFilter.vue';
import DialogForm from './DialogForm.vue';

const storeFilter = useTableFilterStore();

const useDate = useDateFormat();
const { t } = useI18n();
const $q = useQuasar();
const notification = useNotification();
const props = defineProps({
  selected: {
    type: Array,
    required: true,
  },
  deleted: {
    required: true,
  },
  modus: {
    required: true,
  },
  table: {
    type: String,
    required: true,
  },
});
const emit = defineEmits(['update:deleted', 'update:modus', 'change']);
const { deleted, modus } = useVModels(props, emit);
const selected = toRef(props, 'selected');
const filter = computed(() => storeFilter.table(props.table) !== '');

const dialogForm = (
  title: string,
  ids: any[],
  form = props.table,
  selected = null as any
) => {
  $q.dialog({
    component: DialogForm,
    componentProps: {
      title: title,
      form: form,
      maximized: true,
      selected: selected,
      ids: ids,
    },
  }).onOk(() => {
    onEmit();
  });
};

function openFilter() {
  $q.dialog({
    component: DialogFilter,
    componentProps: {
      form: props.table,
    },
  });
}

function onNew() {
  dialogForm('new', null);
}

function onEdit() {
  const ids = selected.value.map((o: any) => o.id);
  dialogForm('edit', ids);
}

function onMove() {
  const ids = selected.value.map((o: any) => o.id);
  dialogForm('movement', null, 'movedate', ids);
}

function onAddQueen() {
  const ids = selected.value.map((o: any) => o.id);
  dialogForm('queen', null, 'queen', ids);
}

function onRestore() {
  const ids = selected.value.map((o: any) => o.id);
  api.patch(`/v1/${props.table}/batchDelete?restore=true`, { ids: ids }).then(
    (_response: any) => {
      onEmit();
      notification.open('positive', '');
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
}

function onDelete() {
  let message = t('deleteConfirmRow', { count: selected.value.length });
  message += props.table === 'hive' ? ' ' + t('deleteConfirmHive') : '';
  $q.dialog({
    title: t('delete'),
    message: message,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    const ids = selected.value.map((o: any) => o.id);
    api.patch(`/v1/${props.table}/batchDelete`, { ids: ids }).then(
      (_response: any) => {
        emit('change');
        notification.open('positive', '');
      },
      (error) => {
        notification.open('negative', error.response);
      }
    );
  });
}

function onEmit() {
  clearCache(props.table);
  emit('change');
}

function onExport() {
  $q.loading.show({ delay: 200 });
  const csv = stringify(unref(selected.value), { header: true });
  const status = exportFile(
    `${props.table}-export-${useDate.getCurrent()}.csv`,
    csv,
    'text/csv'
  );
  $q.loading.hide();
  if (status !== true) {
    $q.notify({
      message: t('failedDownload'),
      color: 'negative',
      icon: 'warning',
    });
  }
}
</script>
