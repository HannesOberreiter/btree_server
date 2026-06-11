<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core';
import { capitalize } from 'lodash-es';
import { storeToRefs } from 'pinia';
import { useInstallPWA } from '@/composables/useInstallPwa';
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BtnBase from '../components/BtnBase.vue';
import { useApiFetch } from '../composables/useApi';
import { useNotification } from '../composables/useNotification';
import { useFieldsettingStore } from '../stores/fieldsetting';

const props = defineProps({
  tab: {
    type: String,
    default: 'fieldSettings'
  }
});

const route = useRoute();
const router = useRouter();

const activeTab = ref(props.tab || 'fieldSettings');

watch(
  () => route.params.tab,
  newTab => {
    if (newTab && typeof newTab === 'string') {
      activeTab.value = newTab;
    }
  }
);

watch(activeTab, newTab => {
  if (newTab !== route.params.tab) {
    router.replace({ name: 'setting-field', params: { tab: newTab } });
  }
});

const notification = useNotification();
const storeFields = useFieldsettingStore();
const { settings } = storeToRefs(storeFields);
const api = useApiFetch();
const { showDialog, isAvailable } = useInstallPWA();

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

const isSubmitting = ref(false);
const isLoading = ref(true);

onMounted(() => storeFields.reload().then(() => (isLoading.value = false)));

function onReset() {
  settings.value = storeFields.reset();
  onSubmit();
}

async function onSubmit() {
  isSubmitting.value = true;
  await api
    .patch('/v1/fieldsetting', { settings: JSON.stringify(settings.value) })
    .then(
      () => {
        notification.open('positive', '');
      },
      error => {
        notification.open('negative', error);
      }
    );
  isSubmitting.value = false;
}
</script>

<template>
  <q-card data-cy="page-setting-field" flat>
    <div class="row q-pa-sm justify-center">
      <div class="col-12 col-sm-10 col-md-8">
        <q-tabs
          v-model="activeTab"
          active-color="primary"
          indicator-color="primary"
          align="justify"
          narrow-indicator
        >
          <q-tab name="fieldSettings" :label="$t('fields')" />
          <q-tab name="localSettings" :label="$t('localSetting')" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="activeTab" animated>
          <q-tab-panel name="fieldSettings">
            <div class="text-body2 q-pb-sm text-center">
              {{ $t('setting.title') }}
            </div>
            <template v-for="(setting, index) in settings" :key="setting">
              <span class="text-h6">{{ $t(index) }}</span>
              <q-separator color="secondary" inset />
              <div class="q-pa-md">
                <template v-for="(subsetting, i) in setting" :key="i">
                  <template v-if="i === 'ratings'">
                    <span class="text-bold">{{ $t('rating.name') }}: </span>
                    <div
                      v-for="(_value, j) in subsetting"
                      :key="j"
                      class="col-12 q-pl-lg"
                    >
                      <div v-if="(j as any) === 'max'">
                        <div class="row">
                          <div class="col-5 col-lg-3">
                            {{ $t('rating.max') }}:
                            {{ settings.checkup.ratings.max }}
                          </div>
                          <div class="col-7 q-pl-md">
                            <q-slider
                              v-model="settings.checkup.ratings.max"
                              :min="0"
                              :max="10"
                              :step="1"
                            />
                          </div>
                        </div>
                      </div>
                      <q-toggle
                        v-else
                        v-model="
                          settings[index as keyof typeof settings][
                            i as keyof typeof setting
                          ][j as keyof typeof subsetting]
                        "
                        :label="$t(`rating.${j}`)"
                        :disable="isSubmitting || isLoading"
                        @update:model-value="onSubmit"
                      />
                    </div>
                    <q-separator color="gray" inset />
                  </template>
                  <template v-else-if="i === 'checkboxes'">
                    <span class="text-bold">{{ $t('checkbox') }}: </span>
                    <div
                      v-for="(_value, j) in subsetting"
                      :key="j"
                      class="col-12 q-pl-md"
                    >
                      <q-toggle
                        v-model="
                          settings[index as keyof typeof settings][
                            i as keyof typeof setting
                          ][j as keyof typeof subsetting]
                        "
                        :label="$t(j as any)"
                        :disable="isSubmitting || isLoading"
                        @update:model-value="onSubmit"
                      />
                    </div>
                    <q-separator color="gray" inset />
                  </template>
                  <template v-else-if="i === 'frame'">
                    <span class="text-bold">{{ $t('frame', 2) }}: </span>
                    <div
                      v-for="(_value, j) in subsetting"
                      :key="j"
                      class="col-12 q-pl-md"
                    >
                      <q-toggle
                        v-model="
                          settings[index as keyof typeof settings][
                            i as keyof typeof setting
                          ][j as keyof typeof subsetting]
                        "
                        :label="$t(`frames.${j}`)"
                        :disable="isSubmitting || isLoading"
                        @update:model-value="onSubmit"
                      />
                    </div>
                    <q-separator color="gray" inset />
                  </template>
                  <div v-else class="col-12">
                    <q-toggle
                      v-model="
                        settings[index as keyof typeof settings][
                          i as keyof typeof setting
                        ]
                      "
                      :label="
                        $t(
                          `setting.hint${capitalize(index)}${capitalize(i as any)}`
                        )
                      "
                      :disable="isSubmitting || isLoading"
                      @update:model-value="onSubmit"
                    />
                  </div>
                </template>
              </div>
            </template>
            <div class="q-pa-md q-gutter-sm">
              <BtnBase :label="$t('save')" color="primary" @click="onSubmit" />
              <BtnBase
                :label="$t('reset')"
                color="negative"
                class="float-right"
                @click="onReset"
              />
            </div>
          </q-tab-panel>

          <q-tab-panel name="localSettings">
            <div class="text-body2 q-pb-sm text-center">
              {{ $t('setting.localTitle') }}
            </div>

            <div class="q-pa-md">
              <div>
                <q-toggle
                  v-model="localPerf['date-auto-close']"
                  :label="$t('autoCloseDate')"
                />
              </div>
              <div>
                <q-toggle
                  v-model="localPerf['hive-clear-after-saving']"
                  :label="$t('setting.hintHiveClearAfterSaving')"
                />
              </div>
              <div>
                <q-toggle
                  v-model="localPerf['calendar-show-weeknumber']"
                  :label="$t('setting.hintCalendarWeeknumber')"
                />
              </div>
              <div>
                <q-toggle
                  v-model="localPerf['show-qr-scanner']"
                  :label="$t('setting.hintShowQrScanner')"
                />
              </div>
              <div>
                <q-toggle
                  v-model="localPerf['show-voice-recognition']"
                  :label="$t('setting.hintShowVoiceRecognition')"
                />
              </div>
            </div>
            <BtnBase
              class="q-mb-sm"
              color="primary"
              icon="fas fa-download"
              :label="$t('pwa.install')"
              :disable="!isAvailable"
              @click="showDialog"
            >
              <q-tooltip v-if="!isAvailable">
                {{ $t('pwa.notAvailable') }}
              </q-tooltip>
            </BtnBase>
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </div>
  </q-card>
</template>
