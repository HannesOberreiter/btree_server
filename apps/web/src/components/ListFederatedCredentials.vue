<script setup lang="ts">
import { useQuasar } from 'quasar';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApiFetch } from '../composables/useApi';
import { useNotification } from '../composables/useNotification';
import BtnBase from './BtnBase.vue';
import BtnBaseGroup from './BtnBaseGroup.vue';

const api = useApiFetch();
const $q = useQuasar();
const t = useI18n().t;
const notification = useNotification();
const items = ref<any>(null);

fetchFederatedCredentials();

function fetchFederatedCredentials() {
  api.get('/v1/user/federatedCredentials').then(
    (response: any) => {
      items.value = response;
    },
    error => {
      console.error(error);
    }
  );
}

function deleteFederatedCredential(id: string) {
  api.remove(`/v1/user/federatedCredentials/${id}`).then(
    () => {
      fetchFederatedCredentials();
      notification.open('positive', t('federatedCredentialRemoved'), true);
    },
    error => {
      notification.open('negative', error);
      console.error(error);
    }
  );
}

function addFederatedCredential(
  email: string,
  provider: 'google' | 'apple' = 'google'
) {
  api.post('/v1/user/federatedCredentials', { email, provider }).then(
    () => {
      fetchFederatedCredentials();
      notification.open('positive', t('federatedCredentialAdded'), true);
    },
    error => {
      notification.open('negative', error);
      console.error(error);
    }
  );
}

function addFederatedCredentialDialog(provider: 'google' | 'apple' = 'google') {
  $q.dialog({
    title: t('addFederatedCredential'),
    message: t('enterEmail'),
    prompt: {
      model: '',
      type: 'email',
      label: t('email'),
      lazyRules: true,
      rules: [
        (v: string) => !!v || t('error.emailRequired'),
        (v: string) =>
          /.[^\n\r@\u2028\u2029]*@.+\..+/.test(v) || t('error.mailInvalid')
      ]
    },
    cancel: true,
    persistent: false
  }).onOk((mail: string) => {
    addFederatedCredential(mail, provider);
  });
}
</script>

<template>
  <q-list>
    <q-item v-if="!items">
      <q-item-section class="text-negative text-center">
        <q-item-label>{{ $t('noFederatedCredentials') }}</q-item-label>
      </q-item-section>
    </q-item>
    <q-item v-else-if="items.length === 0">
      <q-item-section class="text-negative text-center">
        <q-item-label>{{ $t('noFederatedCredentials') }}</q-item-label>
      </q-item-section>
    </q-item>
    <q-item v-for="item in items" v-else :key="item.id" clickable>
      <q-item-section>
        <q-item-label>{{ item.mail }}</q-item-label>
        <q-item-label caption>
          {{ item.provider }}
        </q-item-label>
      </q-item-section>
      <q-item-section side>
        <BtnBase
          color="secondary"
          :label="$t('delete')"
          size="md"
          @click="deleteFederatedCredential(item.id)"
        />
      </q-item-section>
    </q-item>
  </q-list>
  <BtnBaseGroup class="q-mt-lg" size="md">
    <BtnBase
      color="primary"
      :label="`${$t('addFederatedCredential')}: Google`"
      outline
      @click="addFederatedCredentialDialog()"
    />
    <BtnBase
      color="primary"
      :label="`${$t('addFederatedCredential')}: Apple`"
      outline
      @click="addFederatedCredentialDialog('apple')"
    />
  </BtnBaseGroup>
</template>
