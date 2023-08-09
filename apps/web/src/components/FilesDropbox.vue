<template>
  <div>
    <q-icon
      name="fas fa-refresh"
      style="cursor: pointer"
      @click="changeFolder(useDropbox.state.path)"
    ></q-icon>
    <btn-base
      flat
      :label="`${$t('folder')}: ${useDropbox.state.path}`"
      @click="changeFolder('')"
    >
      <tooltip-base>{{ $t('back') }}</tooltip-base>
    </btn-base>
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
              <btn-base
                flat
                icon="fas fa-folder"
                :label="truncate(props.row.name, { length: 30 })"
                @click="changeFolder(props.row.path_lower)"
              ></btn-base>
              <div class="text-caption">
                {{
                  useDate.displayFormat(props.row.client_modified, 'date-time')
                }}
              </div>
              <btn-base-group v-if="!select" outline size="sm">
                <btn-base
                  size="sm"
                  icon="fas fa-pen"
                  @click="() => renameFile(props.row)"
                >
                  <tooltip-base>{{ $t('rename') }}</tooltip-base>
                </btn-base>
                <btn-base
                  size="sm"
                  icon="fas fa-trash"
                  @click="() => deleteFile(props.row)"
                >
                  <tooltip-base>{{ $t('delete') }}</tooltip-base>
                </btn-base>
              </btn-base-group>
            </q-card-section>
          </q-card>
          <q-card v-else>
            <q-card-section class="text-center">
              <btn-base
                flat
                :icon="isImage(props.row.name) ? 'fas fa-image' : 'fas fa-file'"
                :label="truncate(props.row.name, { length: 30 })"
                @click="showFile(props.row.id)"
              >
                <tooltip-base>
                  {{ round(props.row.size / 1e6, 1) + ' MB' }}
                </tooltip-base>
              </btn-base>
              <div class="text-caption">
                {{
                  useDate.displayFormat(props.row.client_modified, 'date-time')
                }}
              </div>
              <btn-base
                v-if="select"
                outline
                size="sm"
                @click="onSelect('dropbox:' + props.row.id)"
              >
                {{ $t('select') }}
              </btn-base>
              <btn-base-group v-else outline size="sm">
                <btn-base
                  size="sm"
                  icon="fas fa-pen"
                  @click="() => renameFile(props.row)"
                >
                  <tooltip-base>{{ $t('rename') }}</tooltip-base>
                </btn-base>
                <btn-base
                  size="sm"
                  icon="fas fa-trash"
                  @click="() => deleteFile(props.row)"
                >
                  <tooltip-base>{{ $t('delete') }}</tooltip-base>
                </btn-base>
              </btn-base-group>
            </q-card-section>
          </q-card>
        </div>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { isImage } from '~/helpers';
import { round, truncate } from 'lodash-es';
import { useDateFormat } from '~/composables/useDate';
import { useServiceDropbox } from '~/composables/useDropbox';
import DialogFileShow from '~/components/DialogFileShow.vue';
import { useQuasar } from 'quasar';

import { useI18n } from 'vue-i18n';
import { watch } from 'vue';

const $q = useQuasar();
const useDate = useDateFormat();
const useDropbox = useServiceDropbox();
const { t } = useI18n();

const emit = defineEmits(['selected']);
defineProps({
  select: {
    type: Boolean,
    default: true,
  },
});

const showFile = (id: string) => {
  $q.dialog({
    component: DialogFileShow,
    componentProps: {
      value: `dropbox:${id}`,
    },
  });
};

watch(
  () => useDropbox.state.accessToken,
  (cur) => {
    if (!useDropbox.state.folder && cur && !useDropbox.state.isLoading)
      useDropbox.listFiles();
  },
  { immediate: true },
);

function onSelect(id: string) {
  emit('selected', id);
}

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
