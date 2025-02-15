<script setup lang="ts">
import { useAuthUserStore } from '../stores/auth';
import { ref } from 'vue';
import GlobalLoading from '../components/GlobalLoading.vue';
import FormMainApi from '../components/FormMainApi.vue';
import FormMainCredential from '../components/FormMainCredential.vue';
import FormMainUser from '../components/FormMainUser.vue';
import ListFederatedCredentials from '../components/ListFederatedCredentials.vue';
import ListSessions from '../components/ListSessions.vue';

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
      outside-arrows
    >
      <q-tab name="user" :label="$t('user')" />
      <q-tab name="credentials" :label="$t('credentials')" />
      <q-tab name="federatedCredentials" :label="$t('federatedCredentials')" />
      <q-tab name="session" :label="$t('session', 2)" />

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

      <q-tab-panel name="federatedCredentials">
        <div class="row justify-center">
          <div class="col-12 col-sm-10 col-md-8">
            <div class="text-body2 q-pb-sm text-center">
              {{ $t('profile.federatedCredentials') }}
              {{ $t('profile.federatedCredentialsRemoveNote') }}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
              >
                Google Permissions
              </a>
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

      <q-tab-panel name="session">
        <div class="row justify-center">
          <div class="col-12 col-sm-10 col-md-8">
            <div class="text-body2 q-pb-sm text-center">
              {{ $t('profile.session') }}
            </div>
            <suspense>
              <list-sessions></list-sessions>
              <template #fallback>
                <global-loading></global-loading>
              </template>
            </suspense>
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
