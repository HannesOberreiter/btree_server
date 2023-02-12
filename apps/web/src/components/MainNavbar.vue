<template>
  <div class="row full-width items-center justify-between">
    <div class="col-1 col-sm-2 col-md-auto">
      <q-toolbar-title v-if="$q.screen.gt.xs" shrink>
        {{ company.name }}
      </q-toolbar-title>
    </div>
    <div class="col-2 col-sm-5 col-md-5 col-lg-4">
      <search-hive-apiary></search-hive-apiary>
    </div>

    <div class="col-9 col-sm-5 col-md-auto">
      <div
        class="text-right"
        :class="$q.screen.gt.xs ? 'q-gutter-md' : 'q-gutter-sm'"
      >
        <btn-speak></btn-speak>
        <btn-qr-scanner></btn-qr-scanner>
        <btn-fullscreen v-if="!$q.platform.is.mobile"></btn-fullscreen>
        <btn-dark-mode v-show="!$q.platform.is.mobile"></btn-dark-mode>
        <btn-wake-lock></btn-wake-lock>
        <btn-return></btn-return>
        <btn-base
          v-if="!$q.platform.is.mobile"
          flat
          dense
          color="white"
          size="md"
          icon="fas fa-sign-out-alt"
          @click="onLogout"
        >
          <tooltip-base anchor="bottom middle" self="top middle">
            {{ $t('logout') }}
          </tooltip-base>
        </btn-base>
        <q-btn-dropdown
          v-if="$q.platform.is.mobile"
          unelevated
          color="primary"
          class="q-pa-xs"
          aria-label="Open Dropdown"
        >
          <q-list class="bg-secondary">
            <q-item v-close-popup>
              <q-item-section>
                <btn-dark-mode></btn-dark-mode>
              </q-item-section>
            </q-item>
            <q-item v-close-popup>
              <q-item-section>
                <btn-share :show-path="false"></btn-share>
              </q-item-section>
            </q-item>
            <q-item v-close-popup>
              <q-item-section>
                <btn-base
                  flat
                  dense
                  color="white"
                  size="md"
                  icon="fas fa-share-nodes"
                  @click="onShare"
                >
                  <tooltip-base>QR & NFC</tooltip-base>
                </btn-base>
              </q-item-section>
            </q-item>
            <q-item v-close-popup>
              <q-item-section>
                <btn-base
                  flat
                  dense
                  color="white"
                  size="md"
                  icon="fas fa-sign-out-alt"
                  @click="onLogout"
                ></btn-base>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import DialogShare from './DialogShare.vue';
import { useAuthUserStore } from '~/stores/auth';

import BtnDarkMode from './BtnDarkMode.vue';
import BtnFullscreen from './BtnFullscreen.vue';
import BtnQrScanner from './BtnQrScanner.vue';
import BtnReturn from './BtnReturn.vue';
import BtnShare from './BtnShare.vue';
import BtnSpeak from './BtnSpeak.vue';
import BtnWakeLock from './BtnWakeLock.vue';
import SearchHiveApiary from './SearchHiveApiary.vue';

import { storeToRefs } from 'pinia';

const storeUser = useAuthUserStore();
const { company } = storeToRefs(storeUser);
const $q = useQuasar();

const onLogout = async () => {
  await storeUser.logout();
};

function onShare() {
  $q.dialog({
    component: DialogShare,
    componentProps: {
      url: window.location.href,
    },
  });
}
</script>
