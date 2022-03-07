<template>
  <q-card>
    <div class="row q-pa-sm">
      <div class="col-12 col-sm-10 col-md-8">
        <div class="text-body2 q-pb-sm text-center">
          {{ t('setting.title') }}
        </div>
        <template v-for="(setting, index) in settings" :key="setting">
          <span class="text-h6">{{ t(index) }}</span>
          <q-separator color="secondary" inset />
          <div class="q-pa-md">
            <template v-for="(_value, j) in setting" :key="j">
              <div class="col-12">
                <q-toggle
                  v-model="settings[index][j]"
                  :label="t('setting.hint' + capitalize(index) + capitalize(j))"
                />
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { Fieldsetting, useFieldsettingStore } from 'src/stores/fieldsetting';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from 'src/boot/axios';
import { useNotification } from 'src/composables/useResponseText';
import { capitalize } from 'lodash';
import { sleep } from 'src/helpers';

const { t } = useI18n();
const notification = useNotification();
const storeFields = useFieldsettingStore();
const { settings } = storeToRefs(storeFields);

const isSubmitting = ref(false);

// Small logical helper to prevent overloading our api and only submit the latest one
watch(storeFields.$state, async (cur) => {
  const current = JSON.stringify(cur.settings);
  await sleep(500);
  if (current === JSON.stringify(settings.value)) await onSubmit(cur.settings);
});

const onSubmit = async (cur: Fieldsetting) => {
  isSubmitting.value = true;
  const rawObject = JSON.stringify(cur);
  await api.patch('/v1/fieldsetting', { settings: rawObject }).then(
    () => {
      notification.open('positive', '');
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
  isSubmitting.value = false;
};
</script>
