<template>
  <q-td v-if="label" style="cursor: pointer" @click="dialogForm()">
    {{ label }}
  </q-td>
  <q-td v-else>{{ $t('noQueen') }}</q-td>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import DialogForm from './DialogForm.vue';

const $q = useQuasar();
const emit = defineEmits(['change']);
const props = defineProps({
  id: {
    type: Number,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
});

const dialogForm = (title = 'queenEdit', ids = props.id, form = 'queen') => {
  $q.dialog({
    component: DialogForm,
    componentProps: {
      title: title,
      form: form,
      maximized: true,
      ids: [ids],
    },
  }).onOk(() => {
    onEmit();
  });
};

function onEmit() {
  emit('change');
}
</script>
