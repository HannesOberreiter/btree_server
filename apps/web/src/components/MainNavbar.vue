<script setup lang="ts">
import type { DialogChainObject } from 'quasar';
import { useLocalStorage, useNetwork } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthUserStore } from '../stores/auth';
import BtnBase from './BtnBase.vue';
import BtnDarkMode from './BtnDarkMode.vue';
import BtnFullscreen from './BtnFullscreen.vue';
import BtnQrScanner from './BtnQrScanner.vue';
import BtnReturn from './BtnReturn.vue';
import BtnShare from './BtnShare.vue';
import BtnSpeak from './BtnSpeak.vue';
import BtnWakeLock from './BtnWakeLock.vue';
import DialogShare from './DialogShare.vue';
import DialogWizBee from './DialogWizBee.vue';
import SearchHiveApiary from './SearchHiveApiary.vue';
import TooltipBase from './TooltipBase.vue';

const localPerf = useLocalStorage(
  'pref-local',
  {
    'date-auto-close': false,
    'hive-clear-after-saving': false,
    'calendar-show-weeknumber': true,
    'show-qr-scanner': false,
    'show-voice-recognition': false
  },
  { mergeDefaults: true }
);

const storeUser = useAuthUserStore();
const { company } = storeToRefs(storeUser);
const $q = useQuasar();
const { isOnline } = useNetwork();
const { t } = useI18n();
const offlineDialog = ref<DialogChainObject | null>(null);

watch(isOnline, online => {
  if (!online && !offlineDialog.value) {
    offlineDialog.value = $q
      .dialog({
        title: t('offline'),
        message: t('lostInternetConnection')
      })
      .onDismiss(() => {
        offlineDialog.value = null;
      });
  }
  if (online && offlineDialog.value) {
    offlineDialog.value.hide();
    offlineDialog.value = null;
  }
});

async function onLogout() {
  await storeUser.logout();
}

function onShare() {
  $q.dialog({
    component: DialogShare,
    componentProps: {
      url: window.location.href
    }
  });
}

function onReload() {
  window.location.reload();
}

function onWizBee() {
  $q.dialog({
    component: DialogWizBee
  });
}
</script>

<template>
  <div class="row full-width items-center justify-between">
    <div class="col-1 col-sm-2 col-md-auto">
      <q-toolbar-title v-if="$q.screen.gt.xs" shrink>
        <span v-if="isOnline">
          {{ company.name }}
        </span>
        <span v-else>
          <q-btn
            icon="fas fa-wifi"
            color="negative"
            square
            flat
            @click="() => onReload()"
          >
            {{ $t('offline') }}
            <q-tooltip>{{ $t('reload') }}</q-tooltip>
          </q-btn>
        </span>
      </q-toolbar-title>
    </div>
    <div class="col-2 col-sm-5 col-md-5 col-lg-4">
      <SearchHiveApiary />
    </div>

    <div class="col-9 col-sm-5 col-md-auto">
      <div
        class="text-right"
        :class="$q.screen.gt.xs ? 'q-gutter-md' : 'q-gutter-sm'"
      >
        <BtnSpeak v-if="localPerf['show-voice-recognition']" />
        <BtnQrScanner
          v-if="localPerf['show-qr-scanner'] && !$q.platform.is.mobile"
        />
        <q-btn flat dense @click="onWizBee">
          <q-avatar size="28px">
            <img
              src="/wizbee/favicon-96x96.png"
              alt="WizBee"
              class="wizbee-icon-bw"
            />
          </q-avatar>
          <TooltipBase anchor="bottom middle" self="top middle">
            WizBee
          </TooltipBase>
        </q-btn>
        <BtnFullscreen v-if="!$q.platform.is.mobile" />
        <BtnDarkMode v-show="!$q.platform.is.mobile" />
        <BtnWakeLock />
        <BtnReturn />
        <BtnBase
          v-if="!$q.platform.is.mobile"
          flat
          dense
          color="white"
          size="md"
          icon="fas fa-sign-out-alt"
          @click="onLogout"
        >
          <TooltipBase anchor="bottom middle" self="top middle">
            {{ $t('logout') }}
          </TooltipBase>
        </BtnBase>
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
                <BtnDarkMode />
              </q-item-section>
            </q-item>
            <q-item v-close-popup>
              <q-item-section>
                <BtnShare :show-path="false" />
              </q-item-section>
            </q-item>
            <q-item v-close-popup>
              <q-item-section>
                <BtnBase
                  flat
                  dense
                  color="white"
                  size="md"
                  icon="fas fa-share-nodes"
                  @click="onShare"
                >
                  <TooltipBase>QR & NFC</TooltipBase>
                </BtnBase>
              </q-item-section>
            </q-item>
            <q-item v-if="localPerf['show-qr-scanner']" v-close-popup>
              <q-item-section>
                <BtnQrScanner />
              </q-item-section>
            </q-item>
            <q-item v-close-popup>
              <q-item-section>
                <BtnBase
                  flat
                  dense
                  color="white"
                  size="md"
                  icon="fas fa-sign-out-alt"
                  @click="onLogout"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wizbee-icon-bw {
  filter: grayscale(1) brightness(2);
}
</style>
