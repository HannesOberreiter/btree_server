<template>
  <form-input-text
    v-model="modelValue"
    :values="values"
    :reset="reset"
    label="url"
    icon="fas fa-cloud-arrow-up"
    readonly
    :max-valid="512"
    @click="showFile(modelValue)"
  >
    <template #deepAfter>
      <q-icon
        name="fas fa-xmark"
        style="cursor: pointer"
        class="q-pr-sm"
        @click="modelValue = ''"
      >
        <q-tooltip>{{ $t('clearField') }}</q-tooltip>
      </q-icon>
      <q-icon name="fas fa-file-pen" style="cursor: pointer" @click="inputUrl">
        <q-tooltip>{{ $t('inputUrl') }}</q-tooltip>
      </q-icon>
      <q-icon
        name="fas fa-upload"
        style="cursor: pointer"
        class="q-pr-sm"
        @click="uploadFile"
      >
        <q-tooltip>{{ $t('uploadFile') }}</q-tooltip>
      </q-icon>
      <q-icon name="fab fa-dropbox" style="cursor: pointer" @click="selectFile">
        <q-tooltip>{{ $t('selectFile') }}</q-tooltip>
      </q-icon>
    </template>
  </form-input-text>
</template>

<script setup lang="ts">
import { useVModels } from '@vueuse/core';
import { useQuasar } from 'quasar';
import DialogFileShow from './DialogFileShow.vue';
import DialogFileUpload from './DialogFileUpload.vue';
import DialogFileSelect from './DialogFileSelect.vue';
import { isValidURL } from '~/helpers';
import { useNotification } from '~/composables/useNotification';

const $q = useQuasar();
const { t } = useI18n();
const inputModel = ref(null);
const notification = useNotification();

const props = defineProps({
  modelValue: {
    default: '',
  },
  reset: {
    type: Number,
    default: 0,
  },
  values: {
    type: Object,
    default: null,
  },
});
const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);

const uploadFile = () => {
  $q.dialog({
    component: DialogFileUpload,
  }).onOk((data) => {
    modelValue.value = data;
  });
};

const selectFile = () => {
  $q.dialog({
    component: DialogFileSelect,
  }).onOk((data) => {
    modelValue.value = data;
  });
};

const showFile = (value: string) => {
  if (value && value !== '') {
    $q.dialog({
      component: DialogFileShow,
      componentProps: {
        value: value,
      },
    });
  }
};

const inputUrl = () => {
  $q.dialog({
    prompt: {
      model: inputModel,
      label: t('url'),
    },
  }).onOk((val) => {
    if (!val) return;
    if (!isValidURL(val)) {
      notification.open('warning', 'noValidUrl');
    } else {
      modelValue.value = val;
    }
  });
};
</script>
