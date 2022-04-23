<template>
  <div>
    <q-btn
      no-caps
      flat
      :label="`${$t('folder')}: ${useDropbox.state.path}`"
      icon="fas fa-refresh"
      @click="changeFolder('')"
    ></q-btn>
    <q-table
      v-if="useDropbox.state.folder"
      grid
      :rows="useDropbox.state.folder"
      :rows-per-page-options="[20, 50, 100, 500, 10000]"
    >
      <template #item="props">
        <div class="q-pa-xs col-6 col-md-4">
          <q-card v-if="props.row['.tag'] === 'folder'">
            <q-card-section class="text-center">
              <q-btn
                flat
                no-caps
                icon="fas fa-folder"
                :label="props.row.name"
                @click="changeFolder(props.row.path_lower)"
              ></q-btn>
              <div class="text-caption">
                {{
                  useDate.displayFormat(props.row.client_modified, 'date-time')
                }}
              </div>
              <q-btn-group v-if="!select" outline size="sm">
                <q-btn no-caps @click="() => renameFile(props.row)">
                  {{ $t('rename') }}
                </q-btn>
                <q-btn no-caps @click="() => deleteFile(props.row)">
                  {{ $t('delete') }}
                </q-btn>
              </q-btn-group>
            </q-card-section>
          </q-card>
          <q-card v-else>
            <q-card-section class="text-center">
              <q-btn
                no-caps
                flat
                :icon="isImage(props.row.name) ? 'fas fa-image' : 'fas fa-file'"
                :label="props.row.name"
                @click="showFile(props.row.id)"
              >
                <q-tooltip>
                  {{ round(props.row.size / 1e6, 1) + ' MB' }}
                </q-tooltip>
              </q-btn>
              <div class="text-caption">
                {{
                  useDate.displayFormat(props.row.client_modified, 'date-time')
                }}
              </div>
              <q-btn
                v-if="select"
                outline
                no-caps
                size="sm"
                @click="onSelect('dropbox:' + props.row.id)"
              >
                {{ $t('select') }}
              </q-btn>
              <q-btn-group v-else outline size="sm">
                <q-btn no-caps @click="() => renameFile(props.row)">
                  {{ $t('rename') }}
                </q-btn>
                <q-btn no-caps @click="() => deleteFile(props.row)">
                  {{ $t('delete') }}
                </q-btn>
              </q-btn-group>
            </q-card-section>
          </q-card>
        </div>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { isImage } from '~/helpers';
import { round } from 'lodash-es';
import { useDateFormat } from '~/composables/useDate';
import { useServiceDropbox } from '~/composables/useDropbox';
import DialogFile from '~/components/DialogFile.vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const useDate = useDateFormat();
const useDropbox = useServiceDropbox();
const { t } = useI18n();

defineEmits(['select']);
defineProps({
  select: {
    type: Boolean,
    default: true,
  },
});

const showFile = (id: string) => {
  $q.dialog({
    component: DialogFile,
    componentProps: {
      id: id,
    },
  });
};

watch(
  () => useDropbox.state.accessToken,
  (cur) => {
    if (!useDropbox.state.folder && cur) useDropbox.listFiles();
  },
  { immediate: true }
);

function deleteFile(row: any) {
  $q.dialog({
    title: t('delete') + ' ' + row.name,
    message: t('dropbox.deleteFileOrFolder'),
    cancel: true,
  }).onOk(() => {
    useDropbox.deleteFile(row.id);
  });
}

function renameFile(row: any) {
  $q.dialog({
    title: t('new') + ' ' + t('name'),
    prompt: {
      model: '',
      label: row.name,
      type: 'text', // optional
    },
  }).onOk((name: string) => {
    if (name.trim() === '') return;
    else useDropbox.renameFile(row.name, name);
  });
}

function changeFolder(path: string) {
  useDropbox.state.path = path;
  useDropbox.listFiles();
}
</script>
