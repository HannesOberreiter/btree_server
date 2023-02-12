<template>
  <q-card>
    <q-card-section>
      <div class="row">
        <div class="col-12">
          <q-file
            v-model="upload"
            style="max-width: 500px"
            outlined
            accept=".csv"
            label="Upload (.csv)"
            :multiple="false"
            :filter="checkFileType"
            @update:model-value="onFileUpload"
            @rejected="onRejected"
          />
          {{ $t('maxUpload', { msg: maxUpload }) }}
          {{ $t('csvUploadRequired') }}
        </div>
      </div>
      <div v-if="errorMessage" class="row q-pt-sm">
        {{ errorMessage }}
      </div>
      <div v-if="records && lines <= 100" class="row q-pt-sm">
        <div class="col-12">
          <btn-base
            v-if="lines > 0"
            color="primary"
            :loading="isSubmitting"
            @click="onUpload"
          >
            {{ $t('upload') }}
          </btn-base>
        </div>
        <div class="col-12">
          <b>{{ $t('line', 2) }}:</b> {{ lines }}
        </div>
        <div class="col-12">
          <b>{{ $t('example') }}:</b><br />
          <code>
            <span v-for="(item, key) in records[0]" :key="key">
              {{ key }}: {{ item }} ||
            </span>
          </code>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { parse } from 'csv-parse/browser/esm/sync';
import { QRejectedEntry } from 'quasar';
import { useApiFetch } from '~/composables/useApi';
import { useCsvCleanup } from '~/composables/useCsvCleanup';
import { useNotification } from '~/composables/useNotification';
import { ref, computed, toRef } from 'vue';
import { useI18n } from 'vue-i18n';

const notification = useNotification();
const api = useApiFetch();
const { t } = useI18n();
const upload = ref(null);
const lines = ref(0);
const records = ref(null);
const state = ref(null);
const isSubmitting = ref(false);
const errorMessage = ref(null);
const maxUpload = 100;

const props = defineProps({
  table: {
    type: String,
    required: true,
  },
});

const kind = toRef(props, 'table');
const url = computed(() => `/v1/${kind.value}`);
const clean = useCsvCleanup(kind, state);

function streamToString(file: File) {
  const reader = new FileReader();
  reader.onload = () => {
    parseCSV(reader.result);
  };
  reader.onerror = () => {
    notification.open('negative', 'error.CsvReading');
  };
  reader.readAsBinaryString(file);
}

function parseCSV(input: any) {
  try {
    records.value = parse(input, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
    });
    lines.value = records.value.length;
    if (lines.value >= 100) {
      errorMessage.value = t('error.csvTooMuch');
    }
  } catch (e) {
    notification.open('negative', 'error.CsvReading');
    errorMessage.value = e;
    console.error(e);
  }
}

function onFileUpload(file: File) {
  errorMessage.value = null;
  records.value = null;
  lines.value = 0;
  streamToString(file);
  if (!file) return;
}

async function onUpload() {
  for (let index = 0; index < records.value.length; index++) {
    state.value = records.value[index];
    const data = clean.cleanup();
    const success = await api.post(url.value, JSON.stringify(data)).then(
      (_response: any) => {
        notification.open('positive', 'success');
        return true;
      },
      (error) => {
        notification.open('negative', error);
        return false;
      }
    );
    if (!success) break;
  }
  isSubmitting.value = false;
}

function checkFileType(files: any) {
  return files.filter((file: File) => file.type === 'text/csv');
}

function onRejected(rejectedEntries: QRejectedEntry[]) {
  notification.open(
    'negative',
    t('rejectedFiles', { count: rejectedEntries.length }),
    true
  );
}
</script>
