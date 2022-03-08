<template>
  <q-list bordered class="rounded-borders">
    <q-item v-for="value in usersPromise" :key="value.id">
      <q-item-section avatar top>
        <q-icon
          v-if="value.user.id === user.id"
          name="fas fa-crown"
          color="black"
          size="34px"
        />
        <q-icon v-else name="fas fa-user" color="black" size="34px" />
      </q-item-section>

      <q-item-section top>
        <q-item-label caption lines="1">
          {{ value.user.firstname }} {{ value.user.lastname }}
        </q-item-label>
        <q-item-label lines="1">
          <span class="text-weight-medium">{{ value.user.email }}</span>
        </q-item-label>
      </q-item-section>

      <q-item-section top>
        <q-item-label lines="1">
          <span class="text-grey-8">
            Last visit:
            {{ dayjs(value.user.last_visit).locale(locale).format() }}
          </span>
        </q-item-label>
        <q-item-label lines="1" class="text-weight-medium">
          <span v-if="value.rank === 1">Admin</span>
          <span v-else-if="value.rank === 2">User</span>
          <span v-else>Read-Only</span>
        </q-item-label>
      </q-item-section>

      <q-item-section top side>
        <div class="text-grey-8 q-gutter-xs">
          <q-btn
            class="gt-xs"
            size="12px"
            flat
            dense
            round
            icon="fas fa-user-minus"
          />
          <q-btn class="gt-xs" size="12px" flat dense round icon="fas fa-up" />
        </div>
      </q-item-section>
    </q-item>

    <q-separator spaced />
  </q-list>
  <q-btn-group class="q-mt-lg" spread>
    <q-btn
      unelevated
      size="lg"
      color="primary"
      type="submit"
      :loading="isSubmitting"
      :label="t('add') + '' + t('user')"
      @click="addUser"
    />
  </q-btn-group>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthUserStore } from 'src/stores/auth';
import { useAuthTokenStore } from 'src/stores/token';
import { useRefreshStore } from '../stores/refresh';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import ItemCompany from 'src/components/ItemCompany.vue';
import { api } from 'src/boot/axios';
import { useNotification } from '../composables/useResponseText';
import { findIndex } from 'lodash';
import { greatestDurationDenominator } from '@fullcalendar/core';
import dayjs from 'dayjs';

const notification = useNotification();
const { t, locale } = useI18n();
const $q = useQuasar();
const storeUser = useAuthUserStore();
const storeToken = useAuthTokenStore();
const storeRefresh = useRefreshStore();

const { user, company } = storeToRefs(storeUser);
const isSubmitting = ref(false);

const usersPromise = await api.get('/v1/company_user/user').then(
  (response: any) => {
    return response.data;
  },
  (error) => {
    notification.open('negative', error.response);
  }
);

const addUser = () => {
  console.log('t');
};
</script>
