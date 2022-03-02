<template>
  <q-form @submit.prevent.stop="">
    <form-user-password
      v-model:modelPassword="state.password"
      :confirm="false"
    ></form-user-password>
  </q-form>
  <div v-if="storeUser.company.api_active">
    <q-input
      v-model.trim="apiValue"
      label="API Key"
      :type="apiField"
      :readonly="true"
    >
      <template #prepend>
        <q-btn flat icon="fas fa-eye" @click="loadApiValue" />
      </template>
      <template #append>
        <q-btn
          flat
          :disabled="apiField === 'password'"
          icon="fas fa-copy"
          @click="
            copy(apiValue).then(() =>
              notification.open('info', t('copiedToClipboard'))
            )
          "
        />
      </template>
    </q-input>

    <q-select
      v-model="ical"
      :label="t('icalSource')"
      :options="icals"
      :option-label="(opt) => t(opt)"
    >
    </q-select>
    <q-input
      v-model="icalUrl"
      :label="t('icalUrl')"
      :type="apiField"
      :readonly="true"
    >
      <template #append>
        <q-btn
          flat
          :disabled="apiField === 'password'"
          @click="
            copy(icalUrl).then(() =>
              notification.open('info', t('copiedToClipboard'))
            )
          "
          icon="fas fa-copy"
        />
      </template>
    </q-input>
  </div>
  <div class="text-center q-pt-md">
    <q-btn-group spread>
      <q-btn
        v-if="!storeUser.company.api_active"
        @click.prevent.stop="changeApiStatus(true)"
        unelevated
        size="lg"
        color="secondary"
      >
        {{ t('activate') }}
      </q-btn>
      <q-btn
        v-if="storeUser.company.api_active"
        @click.prevent.stop="changeApiStatus(false)"
        unelevated
        size="lg"
        color="negative"
      >
        {{ t('deactivate') }}
      </q-btn>
      <q-btn
        v-if="storeUser.company.api_active"
        @click.prevent.stop="changeApiStatus(true, true)"
        unelevated
        size="lg"
        color="warning"
      >
        {{ t('generateNewKey') }}
      </q-btn>
    </q-btn-group>
  </div>
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { useNotification } from '../composables/useResponseText';
import { api } from 'boot/axios';
import { computed, reactive, ref } from 'vue';
import { useAuthUserStore } from 'src/stores/auth';
import { useI18n } from 'vue-i18n';
import { useClipboard } from '@vueuse/core';
import { map } from 'lodash';
import { QInputProps } from 'quasar';
import { CALENDAR } from '../constants';

import FormUserPassword from './FormUserPassword.vue';

const { t } = useI18n();
const storeUser = useAuthUserStore();
const { copy } = useClipboard();
const notification = useNotification();

const isSubmitting = ref(false);
const apiField = ref('password' as QInputProps['type']);
const apiValue = ref((Math.random() + 1).toString(36));

const icals = CALENDAR.filter((value) => value !== 'vis').map((value) => {
  return value.replace(/s$/, '');
});

const ical = ref('checkup');
const icalUrl = computed(() => {
  return `https://api.btree.at/v1/ext/calendar/${ical.value}/${apiValue.value}`;
});

const state = reactive({
  password: '',
});

const rules = {};
const v = useVuelidate(rules, state);

async function changeApiStatus(value = true, change = false) {
  isSubmitting.value = true;
  const isFormCorrect = await v.value.$validate();
  if (!isFormCorrect) {
    return;
  }
  await api
    .patch('/v1/company', {
      password: state.password,
      api_active: value,
      api_change: change,
    })
    .then(
      async (response: any) => {
        storeUser.$state.company.api_active = response.data.api_active;
        map(storeUser.$state.user.company, (value) => {
          if (response.data.id === value.id) {
            value.api_active = response.data.api_active;
          }
        });
        if (change) await loadApiValue();
      },
      (error) => {
        notification.open('negative', error.response);
      }
    );
  isSubmitting.value = false;
}

async function loadApiValue() {
  isSubmitting.value = true;
  apiField.value = apiField.value === 'text' ? 'password' : 'text';
  if (apiField.value === 'text') {
    await api.get('/v1/company/apikey').then(
      (response: any) => {
        apiValue.value = response.data.api_key;
        notification.open('positive', '');
      },
      (error) => {
        notification.open('negative', error.response);
      }
    );
  }
  isSubmitting.value = false;
}
</script>
