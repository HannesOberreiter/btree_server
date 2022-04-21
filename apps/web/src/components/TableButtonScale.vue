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
import DialogForm from './DialogForm.vue';

const $q = useQuasar();

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
      maximized: true,
      selected: selected,
      ids: ids,
    },
  });
};

function onNew() {
  dialogForm('new', null);
}

function onDelete() {
  dialogForm('edit', null);
}

function onEdit() {
  dialogForm('edit', null);
}
</script>
