<template>
  <q-form @submit.prevent.stop="">
    <form-user-password
      v-model:modelPassword="state.password"
      :confirm="false"
    ></form-user-password>
  </q-form>
  <div v-if="storeUser.company.api_active">
    <div>
      <q-btn
        class="full-width"
        :color="apiField === 'password' ? 'negative' : 'primary'"
        :no-caps="true"
        :label="$t('unlockAPI')"
        icon="fas fa-key"
        @click="loadApiValue"
      ></q-btn>
    </div>
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
              notification.open('info', 'copiedToClipboard'),
            )
          "
        />
      </template>
    </q-input>
    <q-card class="q-mt-sm" flat bordered>
      <q-card-section>
        <div class="text-h5">{{ $t('ical') }}:</div>
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
              :hint="$t('icalHint')"
            >
              <template #append>
                <btn-base
                  flat
                  :disable="apiField === 'password'"
                  icon="fas fa-copy"
                  @click="
                    copy(icalUrl).then(() =>
                      notification.open('info', 'copiedToClipboard'),
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
              <tooltip-base>{{ $t('icalDownload') }}</tooltip-base>
            </btn-base>
          </div>
        </div>
      </q-card-section>
    </q-card>
    <q-card class="q-mt-sm" flat bordered>
      <q-card-section>
        <div class="text-h5">{{ $t('scale.name') }}:</div>
        <form-dropdown-option
          v-model="scale"
          table="scale"
          label="scale.name"
          :filled="false"
          :show-before="false"
        ></form-dropdown-option>
        <q-input
          v-model="scaleUrl"
          :label="$t('scale.api')"
          :type="apiField"
          :readonly="true"
        >
          <template #append>
            <btn-base
              flat
              :disable="apiField === 'password' || scaleUrl === ''"
              icon="fas fa-copy"
              @click="
                copy(scaleUrl).then(() =>
                  notification.open('info', 'copiedToClipboard'),
                )
              "
            />
            <btn-base
              flat
              :disable="apiField === 'password' || scaleUrl === ''"
              icon="fas fa-cloud-arrow-up"
              @click="scaleTest()"
            />
          </template>
        </q-input>
        <div class="q-pt-sm">
          {{ $t('scale.apiHint') }}
        </div>
      </q-card-section>
    </q-card>
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
import { useI18n } from 'vue-i18n';
import { ref, computed, reactive } from 'vue';

import FormDropdownOption from '~/components/FormDropdownOption.vue';
import FormUserPassword from '~/components/FormUserPassword.vue';

const storeUser = useAuthUserStore();
const { t } = useI18n();
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

const scale = ref(null);
const scaleQuery = `?action=CREATE_DEMO&datetime=${new Date().toISOString()}&weight=10.5&temp1=10.2&temp2=8.9&rain=15&hum=53`;
const scaleUrl = computed(() => {
  if (scale.value) {
  } else {
    return '';
  }
  return `${dev === 'production' ? baseUrl : devBackendUrl}/v1/external/scale/${
    scale.value.name
  }/${apiValue.value}${scaleQuery}`;
});

const scaleUrlShort = computed(() => {
  if (scale.value) {
  } else {
    return '';
  }
  return `/v1/external/scale/${scale.value.name}/${apiValue.value}${scaleQuery}`;
});

const state = reactive({
  password: '',
});

const rules = {};
const v = useVuelidate(rules, state, { $autoDirty: true });

async function changeApiStatus(value = true, change = false) {
  isSubmitting.value = true;
  const isFormCorrect = await v.value.$validate();
  if (!isFormCorrect) {
    return;
  }
  if (state.password === '') {
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
      },
    );
  isSubmitting.value = false;
}

async function loadApiValue() {
  isSubmitting.value = true;
  if (apiField.value === 'password') {
    const isFormCorrect = await v.value.$validate();
    if (!isFormCorrect) {
      notification.open(
        'negative',
        t('validations.required', { field: t('password') }),
        true,
      );
      return;
    }
    if (state.password === '') {
      notification.open(
        'negative',
        t('validations.required', { field: t('password') }),
        true,
      );
      return;
    }

    const checkPassword = await api
      .post('/v1/user/checkpassword', {
        password: state.password,
      })
      .then(
        async (response: any) => {
          return response;
        },
        (error) => {
          notification.open('negative', error);
        },
      );

    if (!checkPassword) {
      return;
    }

    await api.get('/v1/company/apikey').then(
      (response: any) => {
        apiField.value = apiField.value === 'text' ? 'password' : 'text';
        apiValue.value = response.api_key;
        notification.open('positive', '');
      },
      (error) => {
        notification.open('negative', error);
      },
    );
  } else {
    apiField.value = apiField.value === 'text' ? 'password' : 'text';
  }
  isSubmitting.value = false;
}

async function scaleTest() {
  if (scaleUrlShort.value) {
    await api.get(scaleUrlShort.value, '', true, true, false).then(
      (response: any) => {
        notification.open(
          'positive',
          `Demo: ${JSON.stringify(response)}`.substring(0, 100) + '...',
          true,
        );
      },
      (error) => {
        notification.open('negative', error);
      },
    );
  }
}
</script>
