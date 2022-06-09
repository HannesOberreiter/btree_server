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
        <btn-base flat icon="fas fa-eye" @click="loadApiValue" />
      </template>
      <template #append>
        <btn-base
          flat
          :disable="apiField === 'password'"
          icon="fas fa-copy"
          @click="
            copy(apiValue).then(() =>
              notification.open('info', 'copiedToClipboard')
            )
          "
        />
      </template>
    </q-input>

    <q-select
      v-model="ical"
      :label="$t('icalSource')"
      :options="icals"
      :option-label="(opt) => $t(opt)"
    >
    </q-select>
    <div class="row justify-center items-center">
      <div class="col-11">
        <q-input
          v-model="icalUrl"
          :label="$t('icalUrl')"
          :type="apiField"
          :readonly="true"
        >
          <template #append>
            <btn-base
              flat
              :disable="apiField === 'password'"
              icon="fas fa-copy"
              @click="
                copy(icalUrl).then(() =>
                  notification.open('info', 'copiedToClipboard')
                )
              "
            />
          </template>
        </q-input>
      </div>
      <div class="col-1">
        <btn-base
          :disable="apiField === 'password'"
          :href="icalUrl"
          download
          icon="fas fa-archive"
        >
        </btn-base>
      </div>
    </div>
  </div>
  <div class="text-center q-pt-md">
    <btn-base-group>
      <btn-base
        v-if="!storeUser.company.api_active"
        size="md"
        color="secondary"
        @click.prevent.stop="changeApiStatus(true)"
      >
        {{ $t('activate') }}
      </btn-base>
      <btn-base
        v-if="storeUser.company.api_active"
        size="md"
        color="negative"
        @click.prevent.stop="changeApiStatus(false)"
      >
        {{ $t('deactivate') }}
      </btn-base>
      <btn-base
        v-if="storeUser.company.api_active"
        size="md"
        color="secondary"
        @click.prevent.stop="changeApiStatus(true, true)"
      >
        {{ $t('generateNewKey') }}
      </btn-base>
    </btn-base-group>
  </div>
</template>

<script setup lang="ts">
import { CALENDAR } from '~/constants';
import { map } from 'lodash-es';
import { QInputProps } from 'quasar';
import { useAuthUserStore } from '~/stores/auth';
import { useClipboard } from '@vueuse/core';
import { useNotification } from '~/composables/useNotification';
import useVuelidate from '@vuelidate/core';
import { useApiFetch } from '~/composables/useApi';

const storeUser = useAuthUserStore();
const { copy } = useClipboard();
const api = useApiFetch();
const notification = useNotification();
const baseUrl = process.env.BACKEND_URL;
const devBackendUrl = process.env.DEV_BACKEND_URL;

const dev = process.env.NODE_ENV;
const isSubmitting = ref(false);
const apiField = ref('password' as QInputProps['type']);
const apiValue = ref((Math.random() + 1).toString(36));

const icals = CALENDAR.filter((value) => value !== 'vis').map((value) => {
  return value.replace(/s$/, '');
});
icals.push('scale_data');

const ical = ref('checkup');
const icalUrl = computed(() => {
  return `${dev === 'production' ? baseUrl : devBackendUrl}/v1/external/ical/${
    ical.value
  }/${apiValue.value}`;
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
        storeUser.$state.company.api_active = response.api_active;
        map(storeUser.$state.user.company, (value) => {
          if (response.id === value.id) {
            value.api_active = response.api_active;
          }
        });
        if (change) await loadApiValue();
      },
      (error) => {
        notification.open('negative', error);
      }
    );
  isSubmitting.value = false;
}

async function loadApiValue() {
  isSubmitting.value = true;
  if (apiField.value === 'password') {
    await api.get('/v1/company/apikey').then(
      (response: any) => {
        apiField.value = apiField.value === 'text' ? 'password' : 'text';
        apiValue.value = response.api_key;
        notification.open('positive', '');
      },
      (error) => {
        notification.open('negative', error);
      }
    );
  } else {
    apiField.value = apiField.value === 'text' ? 'password' : 'text';
  }
  isSubmitting.value = false;
}
</script>
