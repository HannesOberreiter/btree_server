<template>
  <q-card v-if="useDropbox.state.isLoading">
    <global-loading></global-loading>
  </q-card>
  <q-card v-else>
    <q-card-section v-if="resetInit && account">
      <div class="text-h5">
        <q-icon name="fab fa-dropbox"></q-icon> {{ $t('account') }}:
        {{ account.email }}
      </div>

      <div class="text-caption">
        {{ $t('dropbox.text') }}
        <a href="https://www.dropbox.com/account/connected_apps">
          https://www.dropbox.com/account/connected_apps
        </a>
      </div>
    </q-card-section>
    <q-card-actions v-if="!account">
      <div v-if="resetInit" class="row">
        <div class="col-12 q-pb-sm">
          {{ $t('dropbox.connectText') }}
        </div>
        <div class="col-12">
          <q-btn
            no-caps
            unelevated
            color="primary"
            :label="$t('dropbox.connectAccount')"
            @click="onAuth"
          ></q-btn>
        </div>
      </div>
    </q-card-actions>
    <div v-else>
      <q-card-actions>
        <q-btn-group unelevated>
          <q-btn
            no-caps
            color="primary"
            :label="$t('upload')"
            @click="onUploadFile"
          ></q-btn>
          <q-btn
            no-caps
            color="secondary"
            :label="$t('newFolder')"
            @click="onCreateFolder"
          ></q-btn>
          <q-btn
            no-caps
            color="info"
            :label="$t('dropbox.refreshToken')"
            @click="onToken"
          ></q-btn>
          <q-btn
            no-caps
            color="negative"
            :label="$t('dropbox.deleteAccess')"
            @click="onDelete"
          ></q-btn>
        </q-btn-group>
      </q-card-actions>
      <q-card-section>
        <files-dropbox :select="false"></files-dropbox>
      </q-card-section>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { useNotification } from '~/composables/useResponseText';
import { LoadingBar, useQuasar } from 'quasar';
import { useServiceDropbox } from '~/composables/useDropbox';
import DialogFileUpload from '~/components/DialogFileUpload.vue';

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
    false
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
</script>
