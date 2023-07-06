<template>
  <div v-if="useDropbox.state.isLoading && !isModalOpen()">
    <global-loading></global-loading>
  </div>
  <q-card v-else data-cy="page-setting-dropbox" flat>
    <q-card-section v-if="!resetInit && account">
      <div class="text-h6">
        <q-icon name="fab fa-dropbox"></q-icon> {{ $t('account') }}:
        {{ account.email }}
      </div>

      <div class="text-caption">
        <a
          class="text-orange-8"
          href="https://www.dropbox.com/account/connected_apps"
        >
          https://www.dropbox.com/account/connected_apps
        </a>
      </div>
    </q-card-section>
    <q-card-actions v-if="!account" align="center">
      <div v-if="resetInit" class="row">
        <div class="col-12 q-pb-sm">
          {{ $t('dropbox.connectText') }}
        </div>
        <div class="col-12">
          <btn-base
            color="primary"
            :label="$t('dropbox.connectAccount')"
            @click="onAuth"
          ></btn-base>
        </div>
      </div>
    </q-card-actions>
    <div v-else>
      <q-card-actions align="center">
        <btn-base-group :spread="false">
          <btn-base
            color="primary"
            :label="$t('upload')"
            @click="onUploadFile"
          ></btn-base>
          <btn-base
            color="secondary"
            :label="$t('newFolder')"
            @click="onCreateFolder"
          ></btn-base>
          <btn-base
            color="info"
            :label="$t('dropbox.refreshToken')"
            @click="onToken"
          ></btn-base>
          <btn-base
            color="negative"
            :label="$t('dropbox.deleteAccess')"
            @click="onDelete"
          ></btn-base>
        </btn-base-group>
      </q-card-actions>
      <q-card-section>
        <files-dropbox :select="false"></files-dropbox>
      </q-card-section>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { useNotification } from '~/composables/useNotification';
import { LoadingBar, useQuasar } from 'quasar';
import { useServiceDropbox } from '~/composables/useDropbox';
import DialogFileUpload from '~/components/DialogFileUpload.vue';
import FilesDropbox from '~/components/FilesDropbox.vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const $q = useQuasar();
const notification = useNotification();
const useDropbox = useServiceDropbox();
const account = ref();
const resetInit = ref(false);

const params = router.currentRoute.value.query;

if (params.error) {
  notification.open(
    'negative',
    params.error_description ? params.error_description : params.error,
    false,
  );
} else if (params.code) {
  useDropbox.auth(params.code as string).then(() => onToken());
} else {
  onToken();
}

function onAuth() {
  useDropbox.addAccount();
}

function onDelete() {
  useDropbox.deleteAccount().then(() => reset());
}

function onToken() {
  useDropbox.getAccessToken().then((response) => {
    if (response) {
      useDropbox.getAccount().then((response) => (account.value = response));
    } else {
      reset();
    }
  });
}

function onCreateFolder() {
  $q.dialog({
    prompt: {
      model: '',
      type: 'text', // optional
    },
  }).onOk((data) => {
    useDropbox.createFolder(data as string);
  });
}

function onUploadFile() {
  $q.dialog({
    component: DialogFileUpload,
  }).onOk((data) => {
    console.log(data);
  });
}

function reset() {
  LoadingBar.stop();
  account.value = null;
  resetInit.value = true;
}

const isModalOpen = () =>
  document.getElementsByClassName('q-dialog').length > 0;
</script>
