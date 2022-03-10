<template>
  <q-card>
    <div class="row q-pa-sm justify-center">
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
                  :disable="isSubmitting"
                  @update:model-value="onSubmit"
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
import { useFieldsettingStore } from 'src/stores/fieldsetting';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from 'src/boot/axios';
import { useNotification } from 'src/composables/useResponseText';
import { capitalize } from 'lodash';

const { t } = useI18n();
const notification = useNotification();
const storeFields = useFieldsettingStore();
const { settings } = storeToRefs(storeFields);

const isSubmitting = ref(false);

const onSubmit = async () => {
  isSubmitting.value = true;
  const rawObject = JSON.stringify(settings.value);
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
