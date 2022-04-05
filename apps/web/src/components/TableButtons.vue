<template>
  <q-btn
    class="q-mr-sm"
    color="primary"
    unelevated
    :label="$t('new')"
    @click="onNew"
  />
  <q-btn
    class="q-mr-sm"
    color="secondary"
    unelevated
    :disable="selected.length > 0 ? false : true"
    :label="$t('edit')"
    @click="onEdit"
  />

  <q-btn
    class="q-mr-sm"
    color="warning"
    unelevated
    :icon-right="modus ? 'fas fa-eye' : 'fas fa-eye-slash'"
    :label="$t('inactive')"
    @click="modus = !modus"
  />

  <q-btn-dropdown unelevated color="info" :label="$t('more')">
    <q-list dense>
      <q-item v-close-popup clickable @click="onMove">
        <q-item-section avatar>
          <q-avatar>
            {{ selected.length }}
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('movement') }}</q-item-label>
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
</template>

<script setup lang="ts">
import { useVModels } from '@vueuse/core';
import { api } from '~/boot/axios';
import { clearCache } from '~/composables/useQuery';
import { useNotification } from '~/composables/useResponseText';
import DialogForm from './DialogForm.vue';

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
  $q.dialog({
    title: t('delete'),
    message:
      t('deleteConfirmRow', { count: selected.value.length }) +
      ' ' +
      t('deteConfirmHive'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    const ids = selected.value.map((o: any) => o.id);
    api.patch('/v1/${props.table}/batchDelete', { ids: ids }).then(
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
</script>
