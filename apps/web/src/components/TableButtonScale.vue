<template>
  <q-btn-dropdown no-caps color="orange" :label="$t('scale.name')">
    <q-list>
      <q-item v-close-popup clickable @click="onNew">
        <q-item-section>
          <q-item-label>{{ $t('new') }}</q-item-label>
        </q-item-section>
      </q-item>
      <q-item v-close-popup clickable @click="onEdit">
        <q-item-section>
          <q-item-label>{{ $t('edit') }}</q-item-label>
        </q-item-section>
      </q-item>
      <q-item v-close-popup clickable @click="onDelete">
        <q-item-section>
          <q-item-label>{{ $t('delete') }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useApiFetch } from '~/composables/useApi';
import { useNotification } from '~/composables/useNotification';
import DialogForm from './DialogForm.vue';
import DialogSelectOption from './DialogSelectOption.vue';

const $q = useQuasar();
const { t } = useI18n();
const notification = useNotification();
const api = useApiFetch();
const emit = defineEmits(['change']);

const dialogSelectScale = (type: 'edit' | 'delete') => {
  $q.dialog({
    component: DialogSelectOption,
    componentProps: {
      table: 'scale',
      label: 'scale.name',
    },
  }).onOk((val) => {
    if (type === 'edit') dialogForm('new', [val.id]);
    if (type === 'delete')
      $q.dialog({
        title: t('delete') + ' ' + val.name,
        message: t('scale.deleteText', { name: val.name }),
        cancel: true,
      }).onOk(() => {
        finalDelete(val.id);
      });
  });
};

const dialogForm = (
  title: string,
  ids: any[],
  form = 'scale',
  selected = null as any
) => {
  $q.dialog({
    component: DialogForm,
    componentProps: {
      title: title,
      form: form,
      selected: selected,
      ids: ids,
      maximized: false,
    },
  }).onOk(() => emit('change'));
};

function finalDelete(id: number) {
  api.deleting(`/v1/scale/${id}`).then(
    (_response: any) => {
      emit('change');
      notification.open('positive', '');
    },
    (error) => {
      notification.open('negative', error);
    }
  );
}

function onNew() {
  dialogForm('new', null);
}

function onDelete() {
  dialogSelectScale('delete');
}

function onEdit() {
  dialogSelectScale('edit');
}
</script>
