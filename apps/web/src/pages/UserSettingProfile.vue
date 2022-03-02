<template>
  <q-card>
    <q-tabs
      v-model="activeTab"
      dense
      active-color="secondary"
      indicator-color="secondary"
      align="justify"
      narrow-indicator
    >
      <q-tab name="user" :label="t('user')" />
      <q-tab name="credentials" :label="t('credentials')" />
      <q-tab v-if="userStore.isAdmin" name="api" :label="t('api')" />
    </q-tabs>

    <q-separator />

    <q-tab-panels v-model="activeTab" animated>
      <q-tab-panel name="user">
        <div class="row">
          <div class="col-12 col-sm-10 col-md-8">
            <div class="text-body2 q-pb-sm text-center">
              {{ t('profileUserTitle') }}
            </div>

            <form-main-user></form-main-user>
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="credentials">
        <div class="row">
          <div class="col-12 col-sm-10 col-md-8">
            <div class="text-body2 q-pb-sm text-center">
              {{ t('profileCredentialTitle') }}
            </div>

            <form-main-credential></form-main-credential>
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="api">
        <div class="row">
          <div class="col-12 col-sm-10 col-md-8">
            <div class="text-body2 q-pb-sm text-center">
              {{ t('profileApiTitle') }}
            </div>
            <form-main-api></form-main-api>
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import FormMainUser from '../components/FormMainUser.vue';
import FormMainCredential from '../components/FormMainCredential.vue';
import FormMainApi from '../components/FormMainApi.vue';
import { useAuthUserStore } from 'src/stores/auth';

const prop = defineProps({
  tab: {
    type: String,
    default: 'user',
  },
});

const { t } = useI18n();
const activeTab = ref(prop.tab ? prop.tab : 'user');
const userStore = useAuthUserStore();
</script>
