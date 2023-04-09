<script setup lang="ts">
import { useAuthUserStore } from '~/stores/auth';
import { ref } from 'vue';

import FormMainApi from '~/components/FormMainApi.vue';
import FormMainCredential from '~/components/FormMainCredential.vue';
import FormMainUser from '~/components/FormMainUser.vue';
import ListFederatedCredentials from './ListFederatedCredentials.vue';

const prop = defineProps({
  tab: {
    type: String,
    default: 'user',
  },
});
const activeTab = ref(prop.tab ? prop.tab : 'user');
const userStore = useAuthUserStore();
</script>

<template>
  <q-card flat>
    <q-tabs
      v-model="activeTab"
      dense
      active-color="secondary"
      indicator-color="secondary"
      align="justify"
      narrow-indicator
      no-caps
    >
      <q-tab name="user" :label="$t('user')" />
      <q-tab name="credentials" :label="$t('credentials')" />
      <q-tab name="federatedCredentials" :label="$t('federatedCredentials')" />
      <q-tab v-if="userStore.isAdmin" name="api" :label="$t('api')" />
    </q-tabs>

    <q-separator />

    <q-tab-panels v-model="activeTab" animated>
      <q-tab-panel name="user">
        <div class="row justify-center">
          <div class="col-12 col-sm-10 col-md-8">
            <div class="text-body2 q-pb-sm text-center">
              {{ $t('profile.userTitle') }}
            </div>
            <form-main-user></form-main-user>
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="federatedCredentials">
        <div class="row justify-center">
          <div class="col-12 col-sm-10 col-md-8">
            <div class="text-body2 q-pb-sm text-center">
              {{ $t('profile.federatedCredentials') }}
            </div>
            <suspense>
              <list-federated-credentials></list-federated-credentials>
              <template #fallback>
                <global-loading></global-loading>
              </template>
            </suspense>
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="credentials">
        <div class="row justify-center">
          <div class="col-12 col-sm-10 col-md-8">
            <div class="text-body2 q-pb-sm text-center">
              {{ $t('profile.credentialTitle') }}
            </div>
            <form-main-credential></form-main-credential>
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="api">
        <div class="row justify-center">
          <div class="col-12 col-sm-10 col-md-8">
            <div class="text-body2 q-pb-sm text-center">
              {{ $t('profile.apiTitle') }}
            </div>
            <form-main-api></form-main-api>
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </q-card>
</template>
